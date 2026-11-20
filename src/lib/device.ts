/**
 * עוזר AI שמפעיל את הדפדפן (כמו Claude in Chrome) קיים רק בדפדפני מחשב.
 * בטלפונים ובטאבלטים אין תוספים כאלה, ולכן שם לא מציגים את "מורה פרטי AI".
 */
export function browserAssistantDevice() {
  const nav = navigator as Navigator & { userAgentData?: { mobile?: boolean } };
  if (nav.userAgentData?.mobile) return false;
  if (/Android|iPhone|iPad|iPod|Mobile|Tablet|Silk|Kindle/i.test(nav.userAgent)) return false;
  // iPad מציג את עצמו כ-Mac, אבל יש לו מסך מגע
  if (/Macintosh/.test(nav.userAgent) && nav.maxTouchPoints > 1) return false;
  return true;
}
