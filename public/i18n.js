// UI text in Thai, English and Myanmar (Burmese).
export const LANGS = { th: 'ไทย', en: 'English', my: 'မြန်မာ' };

export const T = {
  en: {
    title: 'Thai Lottery Checker',
    subtitle: 'Results from the Government Lottery Office (GLO). Always confirm big wins with the official results.',
    drawDate: 'Draw date',
    tickets: 'My tickets',
    ticketsHint: 'Type or paste numbers. Every 6-digit number becomes a ticket. Saved on this device.',
    check: 'Check all tickets',
    results: 'Results',
    loading: 'Loading…',
    notAnnounced: 'Results for this draw are not announced yet. The draw is held around 14:30–16:00 Thai time; please try again later.',
    enterTicket: 'Enter at least one ticket number.',
    mustBe6: 'Must be 6 digits',
    noPrize: 'No prize',
    total: 'Total winnings',
    stampDuty: 'before 1% stamp duty',
    officialPdf: 'Official results (PDF)',
    networkError: 'Could not reach the lottery service. Check your internet connection.',
    takePhoto: 'Take photo',
    choosePhoto: 'Choose photo',
    clear: 'Clear all',
    scanHint: 'Photograph one or more tickets — all numbers are read and checked at once.',
    scanning: 'Reading numbers from the photo…',
    scanFound: 'Found {n} ticket number(s). Please make sure they match your tickets.',
    scanNone: 'No 6-digit numbers found in the photo. Try a sharper, closer photo with good light.',
    scanFailed: 'Could not read the photo. Please try again.',
    add: 'Add',
    entryPlaceholder: 'Type a 6-digit number',
    ticketCount: '{n} tickets',
    noTickets: 'No tickets yet. Type a number or scan a photo.',
    yourResults: 'Your results',
    congrats: 'Congratulations!',
    remove: 'Remove',
    prizes: {
      first: '1st prize', near1: 'Next to 1st prize', second: '2nd prize', third: '3rd prize',
      fourth: '4th prize', fifth: '5th prize', last3f: 'First 3 digits', last3b: 'Last 3 digits', last2: 'Last 2 digits',
    },
  },
  th: {
    title: 'ตรวจหวย สลากกินแบ่งรัฐบาล',
    subtitle: 'ผลรางวัลจากสำนักงานสลากกินแบ่งรัฐบาล โปรดตรวจสอบกับผลอย่างเป็นทางการอีกครั้ง',
    drawDate: 'งวดวันที่',
    tickets: 'สลากของฉัน',
    ticketsHint: 'พิมพ์หรือวางเลขได้เลย เลข 6 หลักแต่ละชุดคือสลาก 1 ใบ ระบบจะจำไว้ในเครื่องนี้',
    check: 'ตรวจสลากทั้งหมด',
    results: 'ผลสลากกินแบ่งรัฐบาล',
    loading: 'กำลังโหลด…',
    notAnnounced: 'ยังไม่ประกาศผลรางวัลงวดนี้ การออกรางวัลเริ่มประมาณ 14:30–16:00 น. โปรดลองใหม่ภายหลัง',
    enterTicket: 'กรุณากรอกเลขสลากอย่างน้อย 1 ใบ',
    mustBe6: 'ต้องเป็นเลข 6 หลัก',
    noPrize: 'ไม่ถูกรางวัล',
    total: 'รวมเงินรางวัล',
    stampDuty: 'ก่อนหักอากรแสตมป์ 1%',
    officialPdf: 'ผลรางวัลอย่างเป็นทางการ (PDF)',
    networkError: 'ไม่สามารถเชื่อมต่อบริการได้ กรุณาตรวจสอบอินเทอร์เน็ต',
    takePhoto: 'ถ่ายรูปสลาก',
    choosePhoto: 'เลือกรูปภาพ',
    clear: 'ล้างทั้งหมด',
    scanHint: 'ถ่ายรูปสลากได้หลายใบในรูปเดียว ระบบจะอ่านเลขและตรวจทุกใบพร้อมกัน',
    scanning: 'กำลังอ่านเลขจากรูป…',
    scanFound: 'พบเลขสลาก {n} ใบ โปรดตรวจสอบว่าตรงกับสลากของคุณ',
    scanNone: 'ไม่พบเลข 6 หลักในรูป ลองถ่ายให้ใกล้และชัดขึ้นในที่มีแสงสว่าง',
    scanFailed: 'อ่านรูปไม่สำเร็จ กรุณาลองใหม่',
    add: 'เพิ่ม',
    entryPlaceholder: 'พิมพ์เลข 6 หลัก',
    ticketCount: '{n} ใบ',
    noTickets: 'ยังไม่มีสลาก พิมพ์เลขหรือถ่ายรูปสลากได้เลย',
    yourResults: 'ผลการตรวจของคุณ',
    congrats: 'ยินดีด้วย!',
    remove: 'ลบ',
    prizes: {
      first: 'รางวัลที่ 1', near1: 'รางวัลข้างเคียงรางวัลที่ 1', second: 'รางวัลที่ 2', third: 'รางวัลที่ 3',
      fourth: 'รางวัลที่ 4', fifth: 'รางวัลที่ 5', last3f: 'เลขหน้า 3 ตัว', last3b: 'เลขท้าย 3 ตัว', last2: 'เลขท้าย 2 ตัว',
    },
  },
  my: {
    title: 'ထိုင်းထီ တိုက်စစ်ရန်',
    subtitle: 'ထိုင်းအစိုးရ ထီရုံး (GLO) ၏ ရလဒ်များ ဖြစ်သည်။ ဆုကြီးပေါက်ပါက တရားဝင်ရလဒ်နှင့် ထပ်မံစစ်ဆေးပါ။',
    drawDate: 'ထီဖွင့်ရက်',
    tickets: 'ကျွန်ုပ်၏ ထီလက်မှတ်များ',
    ticketsHint: 'နံပါတ်များကို ရိုက်ပါ သို့မဟုတ် paste လုပ်ပါ။ ဂဏန်း ၆ လုံးတစ်ခုစီသည် လက်မှတ်တစ်စောင် ဖြစ်ပါမည်။ ဤဖုန်းတွင် မှတ်ထားပါမည်။',
    check: 'လက်မှတ်အားလုံး တိုက်စစ်မည်',
    results: 'ထီပေါက်စဉ်',
    loading: 'ဖွင့်နေသည်…',
    notAnnounced: 'ဤအကြိမ်အတွက် ရလဒ် မထွက်သေးပါ။ ထိုင်းစံတော်ချိန် ၁၄:၃၀–၁၆:၀၀ ခန့်တွင် ဖွင့်ပါသည်။ နောက်မှ ပြန်ကြည့်ပါ။',
    enterTicket: 'ထီနံပါတ် အနည်းဆုံး တစ်ခု ထည့်ပါ။',
    mustBe6: 'ဂဏန်း ၆ လုံး ဖြစ်ရပါမည်',
    noPrize: 'ထီမပေါက်ပါ',
    total: 'စုစုပေါင်း ဆုငွေ',
    stampDuty: 'တံဆိပ်ခေါင်းခွန် ၁% မနုတ်မီ',
    officialPdf: 'တရားဝင် ရလဒ် (PDF)',
    networkError: 'ထီဝန်ဆောင်မှုသို့ ချိတ်ဆက်၍ မရပါ။ အင်တာနက်ကို စစ်ဆေးပါ။',
    takePhoto: 'ဓာတ်ပုံရိုက်မည်',
    choosePhoto: 'ဓာတ်ပုံရွေးမည်',
    clear: 'အားလုံးရှင်းမည်',
    scanHint: 'ထီလက်မှတ် တစ်စောင် သို့မဟုတ် အများအပြားကို ဓာတ်ပုံရိုက်ပါ။ နံပါတ်အားလုံးကို တစ်ပြိုင်နက် ဖတ်ပြီး တိုက်စစ်ပေးပါမည်။',
    scanning: 'ဓာတ်ပုံမှ နံပါတ်များကို ဖတ်နေသည်…',
    scanFound: 'ထီနံပါတ် {n} ခု တွေ့ပါသည်။ သင့်လက်မှတ်များနှင့် ကိုက်ညီကြောင်း စစ်ဆေးပါ။',
    scanNone: 'ဓာတ်ပုံတွင် ဂဏန်း ၆ လုံး နံပါတ် မတွေ့ပါ။ အလင်းကောင်းသောနေရာတွင် နီးနီးနှင့် ရှင်းရှင်း ထပ်ရိုက်ပါ။',
    scanFailed: 'ဓာတ်ပုံကို ဖတ်၍ မရပါ။ ထပ်စမ်းပါ။',
    add: 'ထည့်မည်',
    entryPlaceholder: 'ဂဏန်း ၆ လုံး ရိုက်ပါ',
    ticketCount: '{n} စောင်',
    noTickets: 'ထီလက်မှတ် မရှိသေးပါ။ နံပါတ်ရိုက်ပါ သို့မဟုတ် ဓာတ်ပုံရိုက်ပါ။',
    yourResults: 'သင့်ရလဒ်',
    congrats: 'ဂုဏ်ယူပါတယ်!',
    remove: 'ဖယ်ရှားမည်',
    prizes: {
      first: 'ပထမဆု', near1: 'ပထမဆုနှင့် ကပ်လျက်ဆု', second: 'ဒုတိယဆု', third: 'တတိယဆု',
      fourth: 'စတုတ္ထဆု', fifth: 'ပဉ္စမဆု', last3f: 'ရှေ့ ၃ လုံး', last3b: 'နောက် ၃ လုံး', last2: 'နောက် ၂ လုံး',
    },
  },
};

const MY_MONTHS = ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'ဩဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'];
const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';
export const myNum = (n) => String(n).replace(/\d/g, (d) => MY_DIGITS[d]);

export function formatDate(iso, lang) {
  const d = new Date(iso + 'T00:00:00');
  if (lang === 'my') return `${myNum(d.getFullYear())} ${MY_MONTHS[d.getMonth()]} ${myNum(d.getDate())}`;
  return d.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function detectLang() {
  try { const saved = localStorage.getItem('lang'); if (saved in T) return saved; } catch {}
  const nav = (navigator.language || 'en').slice(0, 2);
  return nav in T ? nav : 'en';
}
