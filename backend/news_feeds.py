"""RSS-ленты для раздела новостей. Нерабочие ленты после проверки (check_feeds.py) просто удали."""

FEEDS: dict[str, dict[str, str]] = {
    "ИБ": {
        "BleepingComputer (EN)": "https://www.bleepingcomputer.com/feed/",
        "The Hacker News (EN)": "https://feeds.feedburner.com/TheHackersNews",
        "Krebs on Security (EN)": "https://krebsonsecurity.com/feed/",
        "Хакер (RU)": "https://xakep.ru/feed/",
        "Хабр: Информационная безопасность (RU)": "https://habr.com/ru/rss/hubs/infosecurity/articles/all/?fl=ru",
        "OpenNet: проблемы безопасности (RU)": "https://www.opennet.ru/opennews/opennews_sec.rss",
    },
    "ИТ": {
        "Хабр: новости (RU)": "https://habr.com/ru/rss/news/?fl=ru",
        "OpenNet: новости (RU)": "https://www.opennet.ru/opennews/opennews_all.rss",
        "Ars Technica (EN)": "https://feeds.arstechnica.com/arstechnica/index",
        "TechCrunch (EN)": "https://techcrunch.com/feed/",
    },
}