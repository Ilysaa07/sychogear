// SYCHOGEAR Admin Widget v1.0
// Paste this script into your Scriptable app on iOS

// --- CONFIGURATION ---
const API_URL = "https://sychogear.vercel.app/api/admin/widget"; 
const API_KEY = "sychogear_default_widget_key_123"; // Ganti jika Anda mengubah di .env
// ----------------------

let data = await fetchData();
let widget = await createWidget(data);

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentLarge();
}

Script.complete();

async function fetchData() {
  try {
    let req = new Request(API_URL);
    req.headers = { "x-widget-key": API_KEY };
    let res = await req.loadJSON();
    return res.success ? res.data : null;
  } catch (e) {
    return null;
  }
}

async function createWidget(data) {
  let w = new ListWidget();
  w.backgroundColor = new Color("#0a0a0a"); // Space Black
  w.setPadding(16, 16, 16, 16);

  // Title Section
  let titleStack = w.addStack();
  titleStack.centerAlignContent();
  
  let brandText = titleStack.addText("SYCHOGEAR");
  brandText.textColor = new Color("#ff0000"); // Signature Red
  brandText.font = Font.boldSystemFont(14);
  
  titleStack.addSpacer();
  
  let adminText = titleStack.addText("ADMIN");
  adminText.textColor = Color.white();
  adminText.font = Font.systemFont(10);
  adminText.textOpacity = 0.6;

  w.addSpacer(12);

  if (!data) {
    let errText = w.addText("Failed to load data");
    errText.textColor = Color.red();
    errText.font = Font.mediumSystemFont(12);
    return w;
  }

  // Summary Row
  let summaryStack = w.addStack();
  
  // Revenue
  let revStack = summaryStack.addStack();
  revStack.layoutVertically();
  let revLabel = revStack.addText("REVENUE TODAY");
  revLabel.textColor = Color.white();
  revLabel.textOpacity = 0.5;
  revLabel.font = Font.systemFont(8);
  
  let revVal = revStack.addText(formatCurrency(data.summary.revenueToday));
  revVal.textColor = Color.white();
  revVal.font = Font.boldSystemFont(16);

  summaryStack.addSpacer();

  // Unpaid
  let unpStack = summaryStack.addStack();
  unpStack.layoutVertically();
  let unpLabel = unpStack.addText("UNPAID");
  unpLabel.textColor = Color.white();
  unpLabel.textOpacity = 0.5;
  unpLabel.font = Font.systemFont(8);
  
  let unpVal = unpStack.addText(data.summary.unpaidCount.toString());
  unpVal.textColor = data.summary.unpaidCount > 0 ? Color.orange() : Color.green();
  unpVal.font = Font.boldSystemFont(16);

  w.addSpacer(16);

  // Recent Orders Header
  let orderHeader = w.addText("RECENT ORDERS");
  orderHeader.textColor = Color.white();
  orderHeader.textOpacity = 0.4;
  orderHeader.font = Font.boldSystemFont(10);
  
  w.addSpacer(6);

  // Orders List
  if (data.recentOrders.length === 0) {
    w.addText("No orders yet").font = Font.italicSystemFont(10);
  } else {
    data.recentOrders.forEach(order => {
      let row = w.addStack();
      row.centerAlignContent();
      
      let inv = row.addText(order.invoiceNumber.split('-').pop());
      inv.font = Font.mediumSystemFont(11);
      inv.textColor = Color.white();
      
      row.addSpacer(6);
      
      let name = row.addText(order.customerName);
      name.font = Font.systemFont(10);
      name.textColor = Color.white();
      name.textOpacity = 0.7;
      name.lineLimit = 1;

      row.addSpacer();
      
      let total = row.addText(order.totalFormatted);
      total.font = Font.systemFont(10);
      total.textColor = getStatusColor(order.status);
      
      w.addSpacer(4);
    });
  }

  w.addSpacer();
  
  // Footer
  let footer = w.addText("Refreshed: " + new Date().toLocaleTimeString('id-ID'));
  footer.font = Font.systemFont(8);
  footer.textOpacity = 0.3;
  footer.centerAlignText();

  return w;
}

function formatCurrency(val) {
  return "Rp " + val.toLocaleString('id-ID');
}

function getStatusColor(status) {
  switch(status) {
    case 'PAID': return Color.green();
    case 'UNPAID': return Color.orange();
    case 'CANCELLED': return Color.red();
    default: return Color.white();
  }
}
