"""מאיה/בורסה ו-Dun's 100: מספר עובדים לחברות ציבוריות/גדולות."""
from common import search


def discover_text(sector):
    return search(f"דירוג {sector} מספר עובדים site:duns100.co.il", 6)


def evidence(name):
    return "\n".join(search(q, 4) for q in (
        f"{name} דוח שנתי מספר עובדים site:maya.tase.co.il OR site:tase.co.il",
        f"{name} מספר עובדים"))
