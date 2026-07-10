/** Karbung - penghubung Google Sheets.
 * Tempel di Apps Script sheet pencatatan (Extensions -> Apps Script),
 * lalu Deploy -> New deployment -> Web app,
 * Execute as: Me, Who has access: Anyone.
 * Salin Web app URL ke aplikasi Karbung.
 */
var SHEET_NAME = 'Karangan Bunga';
var FOTO_FOLDER = 'Foto Karangan Bunga';
var HEADERS = ['Tanggal Penerimaan','Jenis Karangan','Pengirim','Ditujukan Ke','Grouping','Catatan','Foto','CID'];

function doGet(){ return out_({ok:true, app:'karbung'}); }

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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
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

function savePhoto_(d){
  var it = DriveApp.getFoldersByName(FOTO_FOLDER);
  var folder = it.hasNext() ? it.next() : DriveApp.createFolder(FOTO_FOLDER);
  var name = ((d.fotoName || d.cid) + '').replace(/[\\/:*?"<>|]/g, '_') + '.jpg';
  var blob = Utilities.newBlob(Utilities.base64Decode(d.fotoBase64), 'image/jpeg', name);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function out_(o){
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
