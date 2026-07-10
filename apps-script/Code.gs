/** Karbung - penghubung Google Sheets.
 * Tempel di Apps Script sheet pencatatan (Extensions -> Apps Script),
 * lalu Deploy -> New deployment -> Web app,
 * Execute as: Me, Who has access: Anyone.
 * Salin Web app URL ke aplikasi Karbung.
 */
// ID spreadsheet tujuan (bagian URL antara /d/ dan /edit).
// Boleh kosong ('') HANYA jika skrip dibuat dari dalam sheet (Extensions -> Apps Script).
var SHEET_ID = '';
var SHEET_NAME = 'Karangan Bunga';
// ID folder Drive tujuan foto. Kosongkan ('') untuk membuat folder otomatis.
var FOTO_FOLDER_ID = '17ZHPnNNnIV2-MWOOhjwvkGvdyliC5wJu';
var FOTO_FOLDER = 'Foto Karangan Bunga'; // fallback bila ID kosong/tidak bisa diakses
var HEADERS = ['Tanggal Penerimaan','Jenis Karangan','Pengirim','Ditujukan Ke','Grouping','Catatan','Foto','CID'];

function doGet(e){
  try{
    if(e && e.parameter && e.parameter.action === 'list') return out_(listRows_());
    var ss = getSpreadsheet_();
    return out_({ok:true, app:'karbung', sheetName:ss.getName()});
  }catch(err){
    return out_({ok:true, app:'karbung', sheetError:String(err)});
  }
}

function listRows_(){
  var sh = getSheet_();
  var last = sh.getLastRow();
  var items = [];
  if(last >= 2){
    var vals = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
    for(var i = 0; i < vals.length; i++){
      var r = vals[i];
      if(!r[7]) continue; // hanya baris yang punya CID (ditulis oleh app)
      items.push({ tanggal:toIso_(r[0]), jenis:String(r[1]||''), pengirim:String(r[2]||''),
        tujuan:String(r[3]||''), grouping:String(r[4]||''), catatan:String(r[5]||''),
        fotoUrl:String(r[6]||''), cid:String(r[7]) });
    }
  }
  return {ok:true, app:'karbung', items:items};
}

function toIso_(v){
  if(v instanceof Date)
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  return String(v||'');
}

function getSpreadsheet_(){
  if(SHEET_ID) return SpreadsheetApp.openById(SHEET_ID);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Skrip tidak menempel di spreadsheet. Isi SHEET_ID di baris atas kode.');
  return ss;
}

function doPost(e){
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try{
    var d = JSON.parse(e.postData.contents);
    var sh = getSheet_();
    if(d.action === 'delete'){
      var i = findRow_(sh, d.cid);
      if(i > 0) sh.deleteRow(i);
      return out_({ok:true});
    }
    var fotoUrl = '';
    if(d.fotoBase64) fotoUrl = savePhoto_(d);
    var row = [d.tanggal||'', d.jenis||'', d.pengirim||'', d.tujuan||'',
               d.grouping||'', d.catatan||'', fotoUrl, d.cid];
    var idx = findRow_(sh, d.cid);
    if(idx > 0){
      if(!fotoUrl) row[6] = sh.getRange(idx, 7).getValue();
      sh.getRange(idx, 1, 1, HEADERS.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
    return out_({ok:true, fotoUrl:fotoUrl});
  }catch(err){
    return out_({ok:false, error:String(err)});
  }finally{
    lock.releaseLock();
  }
}

function getSheet_(){
  var ss = getSpreadsheet_();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if(sh.getLastRow() === 0){
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function findRow_(sh, cid){
  if(!cid) return -1;
  var last = sh.getLastRow();
  if(last < 2) return -1;
  var cids = sh.getRange(2, HEADERS.length, last - 1, 1).getValues();
  for(var i = 0; i < cids.length; i++)
    if(String(cids[i][0]) === String(cid)) return i + 2;
  return -1;
}

function getFotoFolder_(){
  if(FOTO_FOLDER_ID){
    try{ return DriveApp.getFolderById(FOTO_FOLDER_ID); }catch(e){}
  }
  var it = DriveApp.getFoldersByName(FOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOTO_FOLDER);
}

function savePhoto_(d){
  var folder = getFotoFolder_();
  var name = ((d.fotoName || d.cid) + '').replace(/[\\/:*?"<>|]/g, '_') + '.jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(d.fotoBase64), 'image/jpeg', name);
  var file = folder.createFile(blob);
  // Link publik hanya pelengkap; jangan gagalkan pencatatan bila akun
  // tidak diizinkan membagikan file secara publik.
  try{
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  }catch(e){}
  return file.getUrl();
}

function out_(o){
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
