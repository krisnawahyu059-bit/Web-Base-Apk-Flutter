/* IceBlue FileHub — static frontend build
   Storage: IndexedDB for file blobs + localStorage for metadata/session.
   Google login: Google Identity Services. Set GOOGLE_CLIENT_ID for production.
*/
const GOOGLE_CLIENT_ID = "829243900405-gncnbvjosf5isjk4mi2cr53pq198iqft.apps.googleusercontent.com";
const ADMIN_EMAILS = ["krisnawahyu059@gmail.com"]; // Ganti dengan email Google admin Anda.
const DB_NAME = "Cilx Base Apk", STORE = "files", DB_VERSION = 1;

function $(id){return document.getElementById(id)}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function fmtSize(bytes){if(!bytes)return"0 B";const u=["B","KB","MB","GB"];let i=Math.floor(Math.log(bytes)/Math.log(1024));i=Math.min(i,u.length-1);return`${(bytes/Math.pow(1024,i)).toFixed(i?2:0)} ${u[i]}`}
function fmtDate(ts){return new Date(ts).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}
function toast(msg,type="ok"){const t=$("toast");if(!t)return;t.textContent=msg;t.className=`toast ${type}`;setTimeout(()=>t.className="",2600)}
function getSession(){try{return JSON.parse(localStorage.getItem("ifh_session")||"null")}catch{return null}}
function isAdmin(){const s=getSession();return !!s && ADMIN_EMAILS.map(x=>x.toLowerCase()).includes(s.email.toLowerCase())}
function loginWithEmail(email,name){localStorage.setItem("ifh_session",JSON.stringify({email,name,loginAt:Date.now(),role:ADMIN_EMAILS.map(x=>x.toLowerCase()).includes(email.toLowerCase())?"admin":"user"}));location.href="dashboard.html"}
function logout(){localStorage.removeItem("ifh_session");location.href="login.html"}
function initGoogleLogin(){
  if(!window.google || GOOGLE_CLIENT_ID.startsWith("YOUR_")) return;
  google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:response=>{
    try{
      const payload=JSON.parse(atob(response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
      loginWithEmail(payload.email,payload.name||payload.email.split("@")[0]);
    }catch(e){console.error(e);toast("Credential Google tidak dapat diproses","error")}
  }});
  google.accounts.id.renderButton($("googleButton"),{theme:"outline",size:"large",shape:"pill",width:360,text:"signin_with"});
}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE,{keyPath:"id"})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbPut(file){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put(file);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
async function dbGet(id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(id);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function dbAll(){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res(r.result||[]);r.onerror=()=>rej(r.error)})}
async function dbDelete(id){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).delete(id);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)})}
function fileMeta(all){return all.map(({blob,...m})=>m)}
async function getFiles(){return fileMeta(await dbAll())}
async function getFile(id){return dbGet(id)}
function navHTML(page){
 const admin=isAdmin();
 return `<div class="brand"><span class="brand-mark">IF</span><div><b>IceBlue</b><small>FILEHUB</small></div></div>
 <nav class="nav">
  <a class="${page==="dashboard"?"active":""}" href="dashboard.html"><span class="nav-icon">⌂</span>Dashboard</a>
  <a class="${page==="download"?"active":""}" href="download.html"><span class="nav-icon">↓</span>Download Center</a>
  ${admin?`<a class="${page==="admin"?"active":""}" href="admin.html"><span class="nav-icon">⚙</span>Admin Console</a>`:""}
 </nav>
 <div class="sidebar-bottom"><div class="theme-mini">ICE BLUE SYSTEM<br><span>Local browser storage enabled</span></div><button class="btn logout" id="logoutBtn">↪ &nbsp; Keluar</button></div>`;
}
async function bootPage(page){
 const s=getSession();
 if(!s){location.href="login.html";return}
 if(page==="admin"&&!isAdmin()){location.href="dashboard.html";return}
 $("sidebar").innerHTML=navHTML(page);
 $("userPill").innerHTML=`<span class="user-avatar">${esc((s.name||"U")[0].toUpperCase())}</span>${esc(s.name||s.email)}`;
 $("logoutBtn").onclick=logout;
 const theme=localStorage.getItem("ifh_theme")||"dark";document.body.classList.toggle("light",theme==="light");
 $("themeBtn").onclick=()=>{const light=!document.body.classList.contains("light");document.body.classList.toggle("light",light);localStorage.setItem("ifh_theme",light?"light":"dark")};
 $("menuBtn")?.addEventListener("click",()=> $("sidebar").classList.toggle("open"));
 if(page==="dashboard") await renderDashboard(s);
 if(page==="download") await renderDownloads();
 if(page==="admin") await initAdmin();
}
async function renderDashboard(s){
 $("welcomeTitle").textContent=`Welcome, ${s.name||"User"}.`;
 $("statRole").textContent=isAdmin()?"ADMIN":"USER";
 const files=await getFiles();$("statFiles").textContent=files.length;$("statSize").textContent=fmtSize(files.reduce((a,f)=>a+f.size,0));
 const recent=[...files].sort((a,b)=>b.createdAt-a.createdAt).slice(0,6);
 $("recentFiles").innerHTML=recent.length?recent.map(f=>`<div class="file-row"><div class="file-name"><span class="file-icon">${iconFor(f.name)}</span>${esc(f.name)}</div><div class="muted">${fmtSize(f.size)}</div><div class="muted">${fmtDate(f.createdAt)}</div><a class="text-link" href="download.html">Download</a></div>`).join(""):`<div class="empty">Belum ada file. Admin dapat menambahkan file melalui Admin Console.</div>`;
 document.querySelectorAll(".admin-only").forEach(x=>x.style.display=isAdmin()?"flex":"none");
}
function iconFor(name){const ext=(name.split(".").pop()||"").toLowerCase();return["zip","rar","7z"].includes(ext)?"▣":["jpg","jpeg","png","webp","gif"].includes(ext)?"▧":["mp3","wav","flac","ogg"].includes(ext)?"♫":["mp4","mkv","mov","webm"].includes(ext)?"▶":"▤"}
async function renderDownloads(){
 const all=await getFiles();
 const draw=()=>{
  const q=($("searchInput").value||"").toLowerCase();let files=all.filter(f=>f.name.toLowerCase().includes(q));
  const sort=$("sortSelect").value;if(sort==="name")files.sort((a,b)=>a.name.localeCompare(b.name));else if(sort==="size")files.sort((a,b)=>b.size-a.size);else files.sort((a,b)=>b.createdAt-a.createdAt);
  $("downloadList").innerHTML=files.length?files.map(f=>`<article class="download-card glass"><div class="download-top"><span class="file-icon">${iconFor(f.name)}</span><span class="muted">${esc(f.ext||"FILE")}</span></div><h3>${esc(f.name)}</h3><p>${esc(f.description||"File tersedia untuk diunduh.")}</p><div class="download-meta"><span>${fmtSize(f.size)}</span><span>${fmtDate(f.createdAt)}</span></div><button class="btn btn-primary download-btn" data-download="${esc(f.id)}">↓ Download</button></article>`).join(""):`<div class="empty glass">Tidak ada file yang cocok.</div>`;
  document.querySelectorAll("[data-download]").forEach(b=>b.onclick=()=>downloadFile(b.dataset.download));
 };
 $("searchInput").oninput=draw;$("sortSelect").onchange=draw;draw();
}
async function downloadFile(id){
 const f=await getFile(id);if(!f)return;
 const url=URL.createObjectURL(f.blob);const a=document.createElement("a");a.href=url;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
}
let queue=[];
async function initAdmin(){
 const input=$("fileInput"),drop=$("dropzone");
 const renderQueue=()=>{$("uploadQueue").innerHTML=queue.map((f,i)=>`<div class="queue-item"><span>${esc(f.name)}</span><span>${fmtSize(f.size)} · <a href="#" data-q="${i}">×</a></span></div>`).join("");document.querySelectorAll("[data-q]").forEach(x=>x.onclick=e=>{e.preventDefault();queue.splice(+x.dataset.q,1);renderQueue()})};
 const addFiles=fs=>{queue.push(...Array.from(fs));renderQueue()};
 input.onchange=()=>addFiles(input.files);
 ["dragenter","dragover"].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.add("drag")}));
 ["dragleave","drop"].forEach(e=>drop.addEventListener(e,ev=>{ev.preventDefault();drop.classList.remove("drag")}));
 drop.addEventListener("drop",e=>addFiles(e.dataTransfer.files));
 $("uploadBtn").onclick=async()=>{
  if(!queue.length)return toast("Pilih file terlebih dahulu","error");
  for(const f of queue){const id=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random()}`;await dbPut({id,name:f.name,description:"",size:f.size,ext:f.name.includes(".")?f.name.split(".").pop().toUpperCase():"FILE",createdAt:Date.now(),updatedAt:Date.now(),blob:f})}
  queue=[];renderQueue();toast("File berhasil ditambahkan");await renderAdminList();
 };
 await renderAdminList();
}
async function renderAdminList(){
 const files=(await getFiles()).sort((a,b)=>b.createdAt-a.createdAt);$("adminCount").textContent=`${files.length} files`;
 $("adminList").innerHTML=files.length?files.map(f=>`<div class="admin-item"><span class="file-icon">${iconFor(f.name)}</span><div class="admin-info"><b>${esc(f.name)}</b><span>${fmtSize(f.size)} · ${fmtDate(f.createdAt)}</span></div><div class="admin-actions"><button class="btn small-btn" data-edit="${esc(f.id)}">Edit</button><button class="btn small-btn danger" data-delete="${esc(f.id)}">Hapus</button></div></div>`).join(""):`<div class="empty">Library masih kosong.</div>`;
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>openEdit(b.dataset.edit));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(confirm("Hapus file ini?")){await dbDelete(b.dataset.delete);toast("File dihapus");renderAdminList()}});
}
async function openEdit(id){const f=await getFile(id);if(!f)return;$("editId").value=id;$("editName").value=f.name;$("editDescription").value=f.description||"";$("editModal").classList.add("open")}
function closeEdit(){$("editModal").classList.remove("open")}
document.addEventListener("DOMContentLoaded",()=>{
 $("closeModal")?.addEventListener("click",closeEdit);$("cancelEdit")?.addEventListener("click",closeEdit);
 $("saveEdit")?.addEventListener("click",async()=>{const id=$("editId").value,f=await getFile(id);if(!f)return;f.name=$("editName").value.trim()||f.name;f.description=$("editDescription").value.trim();f.updatedAt=Date.now();await dbPut(f);closeEdit();toast("Perubahan disimpan");renderAdminList()});
});
