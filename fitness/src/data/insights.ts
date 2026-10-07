// Curated, fixed insight library (spec 9.4: start with approved content, move to live
// PubMed search later). Every entry was checked against its PubMed record. The Hebrew
// wording is ours and summarises the abstract; it is general guidance, not medical advice.
export type InsightArea = 'run' | 'nutrition' | 'training'

export interface Insight {
  id: string
  area: InsightArea
  title: string
  text: string
  studyType: string
  sample: string
  limitation: string
  source: { label: string; pmid: string; doi?: string }
}

export const INSIGHTS: Insight[] = [
  {
    id: 'run-volume-spike',
    area: 'run',
    title: 'עלייה מהירה בנפח הריצה',
    text: 'בסקירה של מחקרי תצפית, שניים משלושה מחקרים קישרו שינוי חד בנפח הריצה (מרחק, תדירות או מהירות) לסיכון גבוה יותר לפציעת ריצה. מומלץ להעלות נפח בהדרגה.',
    studyType: 'סקירה שיטתית',
    sample: 'ארבעה מחקרים בלבד',
    limitation: 'הראיות מוגבלות מאוד, ואחד המחקרים לא מצא הבדל בסיכון בין עלייה של 10% לעלייה של 24%. כלל ה-10% הוא כלל אצבע ולא סף מוכח.',
    source: { label: 'Damsted et al., Int J Sports Phys Ther, 2018', pmid: '30534459' },
  },
  {
    id: 'protein-intake',
    area: 'nutrition',
    title: 'חלבון ואימוני כוח',
    text: 'במטא-אנליזה של ניסויים מבוקרים, תוספת חלבון לאימוני כוח הגדילה מעט את מסת השריר והכוח. מעבר לכ-1.6 גרם לק״ג ביום לא נראתה תוספת בעלייה במסת הגוף ללא שומן.',
    studyType: 'מטא-אנליזה של ניסויים מבוקרים',
    sample: '49 מחקרים, 1,863 משתתפים',
    limitation: 'מדובר בתוספת קטנה (כ-0.3 ק״ג מסת גוף ללא שומן בממוצע), בבוגרים בריאים ובמחקרים על תוספי חלבון. קשה להכליל לכל אדם.',
    source: { label: 'Morton et al., Br J Sports Med, 2018', pmid: '28698222', doi: '10.1136/bjsports-2017-097608' },
  },
  {
    id: 'weekly-volume',
    area: 'training',
    title: 'נפח שבועי ועלייה במסת שריר',
    text: 'במטא-רגרסיה גדולה, יותר סטים בשבוע לשריר נקשרו לעלייה גדולה יותר בגודל השריר ובכוח, אבל עם תשואה פוחתת. אין צורך להגזים כדי להמשיך להתקדם.',
    studyType: 'מטא-רגרסיה',
    sample: '67 מחקרים, 2,058 משתתפים (כ-79% גברים, גיל ממוצע 25)',
    limitation: 'ניתוח סטטיסטי של מחקרים קיימים ולא ניסוי ישיר, ורוב המשתתפים צעירים. הטווח המדויק האופטימלי לא נקבע.',
    source: { label: 'Pelland et al., Sports Med, 2025', pmid: '41343037', doi: '10.1007/s40279-025-02344-w' },
  },
  {
    id: 'deload-consensus',
    area: 'training',
    title: 'שבוע קל',
    text: 'מאמני כוח מנוסים הסכימו על הגדרה: דלוד הוא תקופה של עומס מופחת שנועדה להפחית עייפות ולהתאושש לקראת האימונים הבאים. זו לא הפסקה מלאה.',
    studyType: 'קונצנזוס מומחים (Delphi), לא ניסוי',
    sample: '34 מאמנים בסבב הראשון ו-21 בשלישי',
    limitation: 'זו דעת מומחים וניסיון מעשי ולא הוכחה. לא ידוע מהו התזמון או הצורה היעילים ביותר.',
    source: { label: 'Bell et al., Sports Med Open, 2023', pmid: '37730925', doi: '10.1186/s40798-023-00633-0' },
  },
  {
    id: 'proximity-failure',
    area: 'training',
    title: 'כמה קרוב לכשל',
    text: 'בניתוח מטא-רגרסיה, הכוח השתפר בצורה דומה בטווח רחב של מרחק מהכשל, בעוד שגודל השריר נטה לגדול כשהסטים הסתיימו קרוב יותר לכשל. כשמרגיש קל מדי, אפשר להוסיף משקל או חזרות.',
    studyType: 'מטא-רגרסיה חקרנית',
    sample: 'מחקרים מבוקרים בבוגרים, מספר חזרות שמורות (RIR) נאמד בדיעבד',
    limitation: 'החזרות שנשארו הוערכו מתיאור המחקרים ולכן היחס המדויק לא ודאי, והמחברים מגדירים את הניתוח כחקרני.',
    source: { label: 'Robinson et al., Sports Med, 2024', pmid: '38970765', doi: '10.1007/s40279-024-02069-2' },
  },
  {
    id: 'concurrent-training',
    area: 'run',
    title: 'ריצה ואימוני כוח באותו שבוע',
    text: 'במטא-אנליזה, שילוב אימוני אינטרוולים באינטנסיביות גבוהה עם אימוני כוח לא פגע בעלייה בגודל השריר או בכוח פלג גוף עליון. ייתכן שהכוח ברגליים עלה מעט פחות, במיוחד עם אופניים, ופחות עם ריצה. הפרדה גדולה בין האימונים יכולה לעזור.',
    studyType: 'סקירה שיטתית ומטא-אנליזה',
    sample: 'מחקרים על אינטרוולים בעצימות גבוהה (HIIT) ולא על ריצה קלה',
    limitation: 'ההשפעה הקטנה על כוח הרגליים הייתה על גבול המובהקות, והמחקרים לא כוללים בהכרח ריצה קלה כמו בתוכנית שלך.',
    source: { label: 'Sabag et al., J Sports Sci, 2018', pmid: '29658408', doi: '10.1080/02640414.2018.1464636' },
  },
]

export const insightLink = (i: Insight) => (i.source.doi ? `https://doi.org/${i.source.doi}` : `https://pubmed.ncbi.nlm.nih.gov/${i.source.pmid}/`)
