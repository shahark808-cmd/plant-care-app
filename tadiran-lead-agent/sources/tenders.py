"""מכרזים: ביקוש גלוי לשדרוג מוקד/ענן וזוכים (מכרזי מוקד ותקשורת)."""
from common import search


def discover_text(sector):
    return "\n".join(search(q, 5) for q in (
        f"מכרז מוקד שירות לקוחות {sector} site:mr.gov.il",
        f"זוכה במכרז מוקד שירות OR פתרון מוקד OR ענן {sector}"))


def evidence(name):
    return search(f"{name} מכרז מוקד OR ענן OR תקשורת", 4)
