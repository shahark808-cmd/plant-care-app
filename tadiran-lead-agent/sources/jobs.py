"""אתרי דרושים: חברות שמגייסות נציגי שירות/מוקד = מוקד פעיל (כולל חברות לא מוכרות)."""
from common import search

SITES = ("alljobs.co.il", "drushim.co.il", "jobmaster.co.il")


def discover_text(sector):
    qs = [f"site:{s} נציג שירות מוקד {sector}" for s in SITES]
    qs += [f"דרושים נציג שירות לקוחות {sector} חברה", f"דרוש מנהל מוקד {sector}"]
    return "\n".join(search(q, 6) for q in qs)


def evidence(name):
    return "\n".join(search(f"{name} נציג שירות מוקד site:{s}", 4) for s in SITES)
