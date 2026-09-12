import type { Streak } from "@/types/core";

export function StreakStrip({ streak }: { streak: Streak }) {
  return (
    <span className="streakstrip">
      {streak.cells.map((c) =>
        c.weekday ? (
          <span key={c.date} className={`cell ${c.sent ? "sent" : ""}`} title={`${c.date}${c.sent ? ", sent" : ", missed"}`} />
        ) : (
          <span key={c.date} className="cell weekend" title={`${c.date}, weekend`}>
            <i />
          </span>
        )
      )}
    </span>
  );
}
