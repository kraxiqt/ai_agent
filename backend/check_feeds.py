import feedparser
from news_feeds import FEEDS

USER_AGENT = "ai-agent-feed-check/1.0"


def main() -> None:
    for category, feeds in FEEDS.items():
        print(f"\n=== {category} ===")
        for name, url in feeds.items():
            parsed = feedparser.parse(url, agent=USER_AGENT)
            status = getattr(parsed, "status", "нет ответа")
            if not parsed.entries:
                print(f"[НЕТ] {name}: статус {status}, записей нет\n      {url}")
                continue
            latest = parsed.entries[0]
            date = latest.get("published") or latest.get("updated") or "без даты"
            title = (latest.get("title") or "")[:70]
            print(f"[OK]  {name}: записей {len(parsed.entries)}, последняя: {date}")
            print(f"      {title}")


if __name__ == "__main__":
    main()