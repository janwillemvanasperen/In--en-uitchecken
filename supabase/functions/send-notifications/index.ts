import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import webpush from "web-push";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Notification messages in Dutch
const NOTIFICATIONS = {
  schedule_reminder_15: {
    title: "Rooster herinnering",
    body: (startTime: string) =>
      `Je rooster begint over 15 minuten (${startTime})`,
    url: "/student/check-in",
  },
  check_in_reminder: {
    title: "Inchecken",
    body: (startTime: string) =>
      `Vergeet niet in te checken! Je rooster is begonnen om ${startTime}`,
    url: "/student/check-in",
  },
  check_out_reminder: {
    title: "Uitchecken",
    body: (endTime: string) =>
      `Vergeet niet uit te checken! Je rooster eindigde om ${endTime}`,
    url: "/student/check-in",
  },
  schedule_approved: {
    title: "Rooster goedgekeurd",
    body: (from: string, until: string) =>
      `Je rooster voor ${from} - ${until} is goedgekeurd`,
    url: "/student/schedule",
  },
  schedule_rejected: {
    title: "Rooster afgewezen",
    body: (from: string, until: string) =>
      `Je rooster voor ${from} - ${until} is afgewezen`,
    url: "/student/schedule",
  },
  leave_approved: {
    title: "Verlof goedgekeurd",
    body: (date: string) => `Je verlofaanvraag voor ${date} is goedgekeurd`,
    url: "/student/leave-requests",
  },
  leave_rejected: {
    title: "Verlof afgewezen",
    body: (date: string) => `Je verlofaanvraag voor ${date} is afgewezen`,
    url: "/student/leave-requests",
  },
};

// Helper: check if notification was already sent
async function wasAlreadySent(
  userId: string,
  notificationType: string,
  referenceDate: string
): Promise<boolean> {
  const { data } = await supabase
    .from("notification_log")
    .select("id")
    .eq("user_id", userId)
    .eq("notification_type", notificationType)
    .eq("reference_date", referenceDate)
    .limit(1);

  return !!(data && data.length > 0);
}

// Helper: log sent notification
async function logNotification(
  userId: string,
  notificationType: string,
  referenceId: string | null,
  referenceDate: string
) {
  await supabase.from("notification_log").insert({
    user_id: userId,
    notification_type: notificationType,
    reference_id: referenceId,
    reference_date: referenceDate,
  });
}

// Helper: send push to all user subscriptions
async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url: string; tag: string }
) {
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", userId);

  if (!subscriptions || subscriptions.length === 0) return;

  const payloadStr = JSON.stringify(payload);

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payloadStr
      );
    } catch (error: any) {
      // If subscription is expired/invalid, remove it
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", sub.id);
      }
      console.error(`Push failed for ${sub.endpoint}:`, error.message);
    }
  }
}

// Helper: parse time string "HH:mm:ss" to minutes since midnight
function timeToMinutes(time: string): number {
  const parts = time.split(":");
  return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

// Helper: get current time in Amsterdam timezone
function getAmsterdamTime(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Amsterdam" })
  );
}

Deno.serve(async (_req: Request) => {
  try {
    const now = getAmsterdamTime();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const todayISO = now.toISOString().split("T")[0];

    // ISO day of week (1=Monday, 7=Sunday)
    const jsDay = now.getDay();
    const isoDayOfWeek = jsDay === 0 ? 7 : jsDay;

    // --- SCHEDULE-BASED REMINDERS ---
    // Get all approved schedules for today
    const { data: todaySchedules } = await supabase
      .from("schedules")
      .select("*")
      .eq("day_of_week", isoDayOfWeek)
      .eq("status", "approved")
      .lte("valid_from", todayISO)
      .gte("valid_until", todayISO);

    if (todaySchedules) {
      for (const schedule of todaySchedules) {
        const startMinutes = timeToMinutes(schedule.start_time);
        const endMinutes = timeToMinutes(schedule.end_time);
        const userId = schedule.user_id;

        // 15 min before start (within 5-minute window)
        const reminderTime = startMinutes - 15;
        if (
          currentMinutes >= reminderTime &&
          currentMinutes < reminderTime + 5
        ) {
          const alreadySent = await wasAlreadySent(
            userId,
            "schedule_reminder_15",
            todayISO
          );
          if (!alreadySent) {
            const startStr = schedule.start_time.slice(0, 5);
            await sendPushToUser(userId, {
              title: NOTIFICATIONS.schedule_reminder_15.title,
              body: NOTIFICATIONS.schedule_reminder_15.body(startStr),
              url: NOTIFICATIONS.schedule_reminder_15.url,
              tag: "schedule_reminder_15",
            });
            await logNotification(
              userId,
              "schedule_reminder_15",
              schedule.id,
              todayISO
            );
          }
        }

        // At start time (within 5-minute window)
        if (
          currentMinutes >= startMinutes &&
          currentMinutes < startMinutes + 5
        ) {
          const alreadySent = await wasAlreadySent(
            userId,
            "check_in_reminder",
            todayISO
          );
          if (!alreadySent) {
            const startStr = schedule.start_time.slice(0, 5);
            await sendPushToUser(userId, {
              title: NOTIFICATIONS.check_in_reminder.title,
              body: NOTIFICATIONS.check_in_reminder.body(startStr),
              url: NOTIFICATIONS.check_in_reminder.url,
              tag: "check_in_reminder",
            });
            await logNotification(
              userId,
              "check_in_reminder",
              schedule.id,
              todayISO
            );
          }
        }

        // 15 min after end (within 5-minute window)
        const checkoutReminder = endMinutes + 15;
        if (
          currentMinutes >= checkoutReminder &&
          currentMinutes < checkoutReminder + 5
        ) {
          const alreadySent = await wasAlreadySent(
            userId,
            "check_out_reminder",
            todayISO
          );
          if (!alreadySent) {
            // Only send if user is still checked in
            const { data: activeCheckIn } = await supabase
              .from("check_ins")
              .select("id")
              .eq("user_id", userId)
              .is("check_out_time", null)
              .limit(1);

            if (activeCheckIn && activeCheckIn.length > 0) {
              const endStr = schedule.end_time.slice(0, 5);
              await sendPushToUser(userId, {
                title: NOTIFICATIONS.check_out_reminder.title,
                body: NOTIFICATIONS.check_out_reminder.body(endStr),
                url: NOTIFICATIONS.check_out_reminder.url,
                tag: "check_out_reminder",
              });
              await logNotification(
                userId,
                "check_out_reminder",
                schedule.id,
                todayISO
              );
            }
          }
        }
      }
    }

    // --- STATUS CHANGE NOTIFICATIONS ---
    // Schedules approved/rejected in the last 5 minutes
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const { data: recentScheduleChanges } = await supabase
      .from("schedules")
      .select("*")
      .in("status", ["approved", "rejected"])
      .gte("updated_at", fiveMinAgo);

    if (recentScheduleChanges) {
      // Group by submission_group to avoid duplicate notifications
      const processedGroups = new Set<string>();

      for (const schedule of recentScheduleChanges) {
        const groupKey = schedule.submission_group || schedule.id;
        if (processedGroups.has(groupKey)) continue;
        processedGroups.add(groupKey);

        const notifType =
          schedule.status === "approved"
            ? "schedule_approved"
            : "schedule_rejected";
        const alreadySent = await wasAlreadySent(
          schedule.user_id,
          notifType,
          schedule.valid_from
        );

        if (!alreadySent) {
          const fromStr = new Date(schedule.valid_from).toLocaleDateString(
            "nl-NL",
            { day: "numeric", month: "short" }
          );
          const untilStr = new Date(schedule.valid_until).toLocaleDateString(
            "nl-NL",
            { day: "numeric", month: "short" }
          );

          const notifConfig = NOTIFICATIONS[notifType];
          await sendPushToUser(schedule.user_id, {
            title: notifConfig.title,
            body: notifConfig.body(fromStr, untilStr),
            url: notifConfig.url,
            tag: notifType,
          });
          await logNotification(
            schedule.user_id,
            notifType,
            schedule.id,
            schedule.valid_from
          );
        }
      }
    }

    // Leave requests approved/rejected in the last 5 minutes
    const { data: recentLeaveChanges } = await supabase
      .from("leave_requests")
      .select("*")
      .in("status", ["approved", "rejected"])
      .gte("updated_at", fiveMinAgo);

    if (recentLeaveChanges) {
      for (const leave of recentLeaveChanges) {
        const notifType =
          leave.status === "approved" ? "leave_approved" : "leave_rejected";
        const alreadySent = await wasAlreadySent(
          leave.user_id,
          notifType,
          leave.date
        );

        if (!alreadySent) {
          const dateStr = new Date(leave.date).toLocaleDateString("nl-NL", {
            day: "numeric",
            month: "long",
          });

          const notifConfig = NOTIFICATIONS[notifType];
          await sendPushToUser(leave.user_id, {
            title: notifConfig.title,
            body: notifConfig.body(dateStr),
            url: notifConfig.url,
            tag: notifType,
          });
          await logNotification(
            leave.user_id,
            notifType,
            leave.id,
            leave.date
          );
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Notification function error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
