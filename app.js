function bootWsmtApp(){
const ENV = window.WSMT_ENV || {};
const CONFIG = {
  SUPABASE_URL: ENV.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: ENV.VITE_SUPABASE_ANON_KEY || "",
  STRIPE_PAYMENT_LINK: ENV.VITE_STRIPE_PAYMENT_LINK || "",
  CHECKOUT_ENDPOINT: ENV.VITE_CHECKOUT_ENDPOINT || ""
};

function wsmtUuid(){return globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2)}

const seed = {
  session: null,
  profile: { displayName: "Guest", accountType: "Creator", location: "", website: "", bio: "", membership: "inactive", isAdmin: false },
  posts: [
    { id: wsmtUuid(), author: "Marisol Bennett", role: "Founder at GreenPath Supply - Sponsored", body: "Launching wholesale eco packaging for local restaurants this month. Members can book a supplier call and get marketplace placement.", likes: 28, comments: 7, shares: 4, saved: false, liked: false, accent: "accent" },
    { id: wsmtUuid(), author: "Jordan Lee", role: "Creator community - Trending", body: "Our weekly creator sprint starts Friday. Bring one offer, one customer question, and one post draft.", likes: 64, comments: 18, shares: 11, saved: false, liked: false, accent: "gold" }
  ],
  groups: [
    { id: wsmtUuid(), name: "Local Business Builders", description: "Promotions, vendor leads, and weekly accountability discussions.", members: 18400, joined: false },
    { id: wsmtUuid(), name: "Investor Introductions", description: "Founder updates, pitch practice, and moderated deal conversations.", members: 6100, joined: false },
    { id: wsmtUuid(), name: "Creator Growth Lab", description: "Content experiments, audience insights, and scheduled posting workflows.", members: 24700, joined: false }
  ],
  listings: [
    { id: wsmtUuid(), title: "Brand Launch Consulting", category: "Services", price: "$450", art: "consulting" },
    { id: wsmtUuid(), title: "Shared Office Suite", category: "Real estate", price: "$1,200/mo", art: "office" },
    { id: wsmtUuid(), title: "Creator Video Kit", category: "Products", price: "$690", art: "camera" },
    { id: wsmtUuid(), title: "Sales Associate Role", category: "Jobs", price: "Full-time", art: "hiring" }
  ],
  ads: [
    { id: wsmtUuid(), name: "Downtown Job Fair", type: "Event", status: "Active", result: "341 signups", budget: "$800" },
    { id: wsmtUuid(), name: "Starter CRM Offer", type: "Service", status: "Active", result: "96 leads", budget: "$450" },
    { id: wsmtUuid(), name: "Open House Weekend", type: "Real estate", status: "Review", result: "Pending", budget: "$300" }
  ],
  businessPages: [],
  reports: [
    { item: "Subscription dispute", priority: "High", owner: "Billing", status: "Open" },
    { item: "Reported marketplace item", priority: "Medium", owner: "Trust", status: "Reviewing" },
    { item: "Verification request", priority: "Low", owner: "Support", status: "Queued" }
  ]
};

let state = loadLocalState();
let supabaseClient = null;
let currentSession = null;
const hasSupabaseConfig = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
const isSupabaseMode = () => Boolean(supabaseClient && currentSession?.user);
const hasSupabaseClient = () => Boolean(supabaseClient);

function storageKey(){return "wsmt-social-mvp"}
function loadLocalState(){try{const saved=localStorage.getItem(storageKey());return saved?JSON.parse(saved):structuredClone(seed)}catch(error){console.warn("Local storage reset",error);return structuredClone(seed)}}
function saveLocalState(){if(!isSupabaseMode()) localStorage.setItem(storageKey(),JSON.stringify(state))}
function $(id){return document.getElementById(id)}
function on(id,eventName,handler){const element=$(id);if(!element){console.warn("Missing element #"+id);return}element.addEventListener(eventName,handler)}
function logButtonClick(label){console.log("Button clicked:",label)}
// Global button logger: confirms every visible button produces a console signal.
document.addEventListener("click",event=>{const button=event.target.closest?.("button");if(button)console.log("Button clicked:",button.textContent.trim()||button.id||"button")},true)
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2800)}
function currentName(){return state.profile.displayName||state.session?.email?.split("@")[0]||"Guest"}
function currentUserId(){return currentSession?.user?.id || state.session?.userId || null}
function initial(name){return(name||"G").trim().charAt(0).toUpperCase()}
function escapeHtml(value){return String(value ?? "").replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]))}
function requireLogin(){if(!hasSupabaseClient()){toast("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the app.");showView("auth");return false}if(!currentUserId()){toast("Please sign up or log in first.");showView("auth");return false}return true}

async function initSupabase(){
  if(hasSupabaseConfig && window.supabase){
    supabaseClient=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const {data}=await supabaseClient.auth.getSession();
    currentSession=data.session;
    supabaseClient.auth.onAuthStateChange(async (_event, session)=>{currentSession=session; await hydrateFromSupabase(); render();});
    $("storageStatus").textContent=currentSession?"Supabase connected":"Supabase ready";
    $("supabaseState").textContent="Supabase is configured. Signup, login, session persistence, and database writes use your project.";
    await hydrateFromSupabase();
  }else{
    $("storageStatus").textContent="Local demo storage";
    $("supabaseState").textContent="Supabase is not configured. Auth buttons require VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env or deployment settings.";
  }
}

async function hydrateFromSupabase(){
  if(!supabaseClient) return;
  const user=currentSession?.user;
  if(!user){state={...state,session:null}; return;}
  state.session={email:user.email,userId:user.id};
  await ensureProfile(user);
  await Promise.all([loadProfile(),loadPosts(),loadGroups(),loadMarketplace(),loadBusinessPages(),loadAds(),loadSubscription()]);
  $("storageStatus").textContent="Supabase connected";
}

async function ensureProfile(user){
  await supabaseClient.from("profiles").upsert({id:user.id,email:user.email,display_name:user.email?.split("@")[0]||"Member"},{onConflict:"id",ignoreDuplicates:true});
  await supabaseClient.from("subscriptions").upsert({user_id:user.id,status:"inactive"},{onConflict:"user_id",ignoreDuplicates:true});
}

async function loadProfile(){
  const user=currentSession.user;
  const {data,error}=await supabaseClient.from("profiles").select("*").eq("id",user.id).single();
  if(error && error.code!=="PGRST116") console.warn(error.message);
  if(data){state.profile={displayName:data.display_name||"Member",accountType:data.account_type||"Creator",location:data.location||"",website:data.website||"",bio:data.bio||"",membership:state.profile.membership||"inactive",isAdmin:Boolean(data.is_admin)}}
}

async function loadSubscription(){
  const {data}=await supabaseClient.from("subscriptions").select("status").eq("user_id",currentSession.user.id).maybeSingle();
  if(data) state.profile.membership=data.status==="active"?"active":"inactive";
}

async function loadPosts(){
  const [{data:posts=[]},{data:profiles=[]},{data:likes=[]},{data:bookmarks=[]},{data:comments=[]}]=await Promise.all([
    supabaseClient.from("posts").select("id,user_id,content,post_type,created_at").order("created_at",{ascending:false}).limit(50),
    supabaseClient.from("profiles").select("id,display_name,account_type"),
    supabaseClient.from("likes").select("post_id,user_id"),
    supabaseClient.from("bookmarks").select("post_id,user_id").eq("user_id",currentSession.user.id),
    supabaseClient.from("comments").select("post_id")
  ]);
  const profileById=Object.fromEntries(profiles.map(p=>[p.id,p]));
  const likeCounts=countBy(likes,"post_id");
  const commentCounts=countBy(comments,"post_id");
  const bookmarkSet=new Set(bookmarks.map(b=>b.post_id));
  const likedSet=new Set(likes.filter(l=>l.user_id===currentSession.user.id).map(l=>l.post_id));
  state.posts=posts.map(post=>{const profile=profileById[post.user_id]||{};return{id:post.id,userId:post.user_id,author:profile.display_name||"WSMT Member",role:(profile.account_type||"Member")+" - "+new Date(post.created_at).toLocaleDateString(),body:post.content,likes:likeCounts[post.id]||0,comments:commentCounts[post.id]||0,shares:0,saved:bookmarkSet.has(post.id),liked:likedSet.has(post.id),accent:post.user_id===currentSession.user.id?"gold":""}});
}

async function loadGroups(){
  const [{data:groups=[]},{data:members=[]},{data:myMemberships=[]}]=await Promise.all([
    supabaseClient.from("groups").select("id,name,description,owner_id,privacy,created_at").order("created_at",{ascending:false}).limit(50),
    supabaseClient.from("group_members").select("group_id"),
    supabaseClient.from("group_members").select("group_id").eq("user_id",currentSession.user.id)
  ]);
  const counts=countBy(members,"group_id");
  const joined=new Set(myMemberships.map(m=>m.group_id));
  state.groups=groups.map(group=>({id:group.id,name:group.name,description:group.description||"",members:counts[group.id]||0,joined:joined.has(group.id),ownerId:group.owner_id}));
}

async function loadMarketplace(){
  const {data=[]}=await supabaseClient.from("marketplace_items").select("id,title,category,price,description,seller_id,status,created_at").order("created_at",{ascending:false}).limit(50);
  state.listings=data.map((item,index)=>({id:item.id,title:item.title,category:item.category||"Listing",price:item.price||"Contact",description:item.description||"",sellerId:item.seller_id,art:["consulting","office","camera","hiring"][index%4]}));
}

async function loadBusinessPages(){
  const {data=[]}=await supabaseClient.from("business_pages").select("id,name,category,description,website,owner_id,created_at").order("created_at",{ascending:false}).limit(20);
  state.businessPages=data;
}

async function loadAds(){
  const {data=[]}=await supabaseClient.from("advertisements").select("id,name,ad_type,budget,status,result,owner_id,created_at").order("created_at",{ascending:false}).limit(50);
  state.ads=data.map(ad=>({id:ad.id,name:ad.name,type:ad.ad_type,status:ad.status,result:ad.result,budget:ad.budget||"$0",ownerId:ad.owner_id}));
  state.reports=state.ads.filter(ad=>String(ad.status).toLowerCase()==="review").map(ad=>({item:ad.name,priority:"Medium",owner:"Ads",status:"Review"}));
}

function countBy(rows,key){return rows.reduce((acc,row)=>{acc[row[key]]=(acc[row[key]]||0)+1;return acc},{})}
function showView(viewName){document.querySelectorAll(".nav-item").forEach(nav=>nav.classList.toggle("active",nav.dataset.view===viewName));document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===viewName+"-view"));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",()=>{logButtonClick(item.textContent.trim());showView(item.dataset.view)}));
document.querySelectorAll("[data-view-shortcut]").forEach(button=>button.addEventListener("click",()=>{logButtonClick(button.textContent.trim());showView(button.dataset.viewShortcut)}));

async function auth(intent,email,password){
  if(!hasSupabaseClient()){
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the app.");
  }
  const result=intent==="signup"
    ? await supabaseClient.auth.signUp({email,password,options:{data:{display_name:email.split("@")[0]}}})
    : await supabaseClient.auth.signInWithPassword({email,password});
  if(result.error) throw result.error;
  currentSession=result.data.session || currentSession;
  if(result.data.user) currentSession=currentSession || {user:result.data.user};
  await hydrateFromSupabase();
  render();
}

async function resetPassword(email){
  if(!email){toast("Enter your email first.");return}
  if(!hasSupabaseClient()){toast("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the app.");return}
  const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});
  if(error) throw error;
  toast("Password reset email sent.");
}

function render(){const name=currentName();$("profileNameTop").textContent=name;$("profileInitial").textContent=initial(name);$("composerInitial").textContent=initial(name);$("membershipBadge").textContent=state.profile.membership==="active"?"$1/month active":"Membership inactive";$("displayName").value=state.profile.displayName||"";$("accountType").value=state.profile.accountType||"Creator";$("location").value=state.profile.location||"";$("website").value=state.profile.website||"";$("bio").value=state.profile.bio||"";renderMetrics();renderPosts();renderSaved();renderGroups();renderListings();renderAds();renderBusiness();renderAdmin()}
function metric(label,value){return '<article class="metric"><span>'+label+'</span><strong>'+value+'</strong></article>'}
function renderMetrics(){const subscribers=state.profile.membership==="active"?1:0;$("homeMetrics").innerHTML=metric("Members",isSupabaseMode()?"Live":"Demo")+metric("Active subscribers",subscribers)+metric("Monthly recurring revenue","$"+subscribers)+metric("Open reports",state.reports.length)}
function renderPosts(){$("postList").innerHTML=state.posts.map(post=>'<article class="post"><div class="post-top"><div class="avatar '+(post.accent||"")+'">'+initial(post.author)+'</div><div><strong>'+escapeHtml(post.author)+'</strong><span>'+escapeHtml(post.role)+'</span></div></div><p>'+escapeHtml(post.body)+'</p>'+(post.author==="Marisol Bennett"?'<div class="media-preview packaging"></div>':'')+'<div class="post-actions"><button type="button" data-action="like" data-id="'+post.id+'">'+(post.liked?"Liked ":"Like ")+post.likes+'</button><button type="button" data-action="comment" data-id="'+post.id+'">Comment '+post.comments+'</button><button type="button" data-action="share" data-id="'+post.id+'">Share '+post.shares+'</button><button type="button" data-action="save" data-id="'+post.id+'">'+(post.saved?"Saved":"Bookmark")+'</button></div></article>').join("")}
function renderSaved(){const saved=state.posts.filter(post=>post.saved);$("savedList").innerHTML=saved.length?saved.map(post=>'<article class="post"><div class="post-top"><div class="avatar">'+initial(post.author)+'</div><div><strong>'+escapeHtml(post.author)+'</strong><span>Saved post</span></div></div><p>'+escapeHtml(post.body)+'</p></article>').join(""):'<section class="panel"><h2>No saved posts yet</h2><p>Bookmark posts from the feed to collect them here.</p></section>'}
function renderGroups(){$("groupList").innerHTML=state.groups.map(group=>'<article class="feature-card"><strong>'+escapeHtml(group.name)+'</strong><span>'+group.members.toLocaleString()+' members</span><p>'+escapeHtml(group.description)+'</p><div class="button-row"><button class="secondary-button" data-action="join-group" data-id="'+group.id+'" type="button">'+(group.joined?"Joined":"Join")+'</button></div></article>').join("")}
function renderListings(){$("listingList").innerHTML=state.listings.map(listing=>'<article class="listing"><div class="listing-art '+(listing.art||"consulting")+'"></div><strong>'+escapeHtml(listing.title)+'</strong><span>'+escapeHtml(listing.category)+' - '+escapeHtml(listing.price)+'</span><div class="button-row"><button class="secondary-button" type="button">Message Seller</button></div></article>').join("")}
function renderAds(){const spend=state.ads.reduce((sum,ad)=>sum+Number(String(ad.budget).replace(/[^0-9.]/g,"")||0),0);$("adMetrics").innerHTML=metric("Spend","$"+spend.toLocaleString())+metric("Campaigns",state.ads.length)+metric("Leads","Live")+metric("CTR","Live");$("adTable").innerHTML='<div class="table-row table-head"><span>Campaign</span><span>Type</span><span>Status</span><span>Result</span></div>'+state.ads.map(ad=>'<div class="table-row"><span>'+escapeHtml(ad.name)+'</span><span>'+escapeHtml(ad.type)+'</span><span>'+escapeHtml(ad.status)+'</span><span>'+escapeHtml(ad.result)+'</span></div>').join("")}
function renderBusiness(){const count=state.businessPages?.length||0;document.querySelector('#business-view .clean-list').innerHTML='<li><span>Business pages</span><strong>'+count+'</strong></li><li><span>Active ads</span><strong>'+state.ads.length+'</strong></li><li><span>Marketplace listings</span><strong>'+state.listings.length+'</strong></li>'}
function renderAdmin(){const subscribers=state.profile.membership==="active"?1:0;$("adminMetrics").innerHTML=metric("Total users",isSupabaseMode()?"RLS visible":"Demo")+metric("Active subscribers",subscribers)+metric("MRR","$"+subscribers)+metric("Pending reports",state.reports.length);$("moderationQueue").innerHTML='<div class="table-row table-head"><span>Moderation queue</span><span>Priority</span><span>Owner</span><span>Status</span></div>'+state.reports.map(report=>'<div class="table-row"><span>'+escapeHtml(report.item)+'</span><span>'+escapeHtml(report.priority)+'</span><span>'+escapeHtml(report.owner)+'</span><span>'+escapeHtml(report.status)+'</span></div>').join("")}

on("authForm","submit",async event=>{event.preventDefault();const intent=event.submitter.value;logButtonClick(intent==="signup"?"Sign up":"Log in");$("authMessage").textContent="Working...";try{await auth(intent,$("authEmail").value,$("authPassword").value);const email=state.session?.email||$("authEmail").value;$("authMessage").textContent=intent==="signup"?"Signup submitted for "+email+". Check email confirmation settings if login is delayed.":"Logged in as "+email;toast(intent==="signup"?"Signup complete":"Logged in");showView("profile")}catch(error){$("authMessage").textContent=error.message;toast(error.message)}});
on("resetPasswordButton","click",async()=>{logButtonClick("Reset password");try{await resetPassword($("authEmail").value)}catch(error){toast(error.message)}});
on("signOutButton","click",async()=>{logButtonClick("Log out");try{if(!hasSupabaseClient()){toast("Supabase is not configured.");return}const {error}=await supabaseClient.auth.signOut();if(error)throw error;currentSession=null;state=loadLocalState();state.session=null;render();toast("Logged out")}catch(error){toast(error.message)}});
on("profileForm","submit",async event=>{event.preventDefault();if(isSupabaseMode()){const payload={id:currentUserId(),display_name:$("displayName").value,account_type:$("accountType").value,location:$("location").value,website:$("website").value,bio:$("bio").value};const {error}=await supabaseClient.from("profiles").upsert(payload);if(error)throw error;await loadProfile()}else{state.profile={...state.profile,displayName:$("displayName").value,accountType:$("accountType").value,location:$("location").value,website:$("website").value,bio:$("bio").value};saveLocalState()}render();toast("Profile saved")});
on("composer","submit",async event=>{event.preventDefault();if(!requireLogin())return;const body=$("postText").value.trim();if(!body)return;if(isSupabaseMode()){const {error}=await supabaseClient.from("posts").insert({user_id:currentUserId(),content:body,post_type:"text"});if(error)throw error;await loadPosts()}else{state.posts.unshift({id:wsmtUuid(),author:currentName(),role:(state.profile.accountType||"Member")+" - Just now",body,likes:0,comments:0,shares:0,saved:false,liked:false});saveLocalState()}$("postText").value="";render();toast("Post published")});
document.addEventListener("click",async event=>{const button=event.target.closest("button[data-action]");if(!button)return;if(!requireLogin())return;const id=button.dataset.id;const action=button.dataset.action;if(isSupabaseMode()){if(action==="like"){const post=state.posts.find(p=>p.id===id);if(post.liked)await supabaseClient.from("likes").delete().eq("post_id",id).eq("user_id",currentUserId());else await supabaseClient.from("likes").insert({post_id:id,user_id:currentUserId()});await loadPosts()}if(action==="save"){const post=state.posts.find(p=>p.id===id);if(post.saved)await supabaseClient.from("bookmarks").delete().eq("post_id",id).eq("user_id",currentUserId());else await supabaseClient.from("bookmarks").insert({post_id:id,user_id:currentUserId()});await loadPosts()}if(action==="comment"){const content=prompt("Add a comment");if(content)await supabaseClient.from("comments").insert({post_id:id,user_id:currentUserId(),content});await loadPosts()}if(action==="join-group"){const group=state.groups.find(g=>g.id===id);if(group.joined)await supabaseClient.from("group_members").delete().eq("group_id",id).eq("user_id",currentUserId());else await supabaseClient.from("group_members").insert({group_id:id,user_id:currentUserId()});await loadGroups()}}else{if(action==="like"){const post=state.posts.find(p=>p.id===id);post.liked=!post.liked;post.likes+=post.liked?1:-1}if(action==="comment"){const content=prompt("Add a comment");if(content)state.posts.find(p=>p.id===id).comments++}if(action==="share")state.posts.find(p=>p.id===id).shares++;if(action==="save"){const post=state.posts.find(p=>p.id===id);post.saved=!post.saved}if(action==="join-group"){const group=state.groups.find(g=>g.id===id);group.joined=!group.joined;group.members+=group.joined?1:-1}saveLocalState()}render()});
on("groupForm","submit",async event=>{event.preventDefault();if(!requireLogin())return;const name=$("groupName").value,description=$("groupDescription").value;if(isSupabaseMode()){const {data,error}=await supabaseClient.from("groups").insert({owner_id:currentUserId(),name,description,privacy:"public"}).select("id").single();if(error)throw error;await supabaseClient.from("group_members").insert({group_id:data.id,user_id:currentUserId(),role:"admin"});await loadGroups()}else{state.groups.unshift({id:wsmtUuid(),name,description,members:1,joined:true});saveLocalState()}event.target.reset();render();toast("Group created")});
on("listingForm","submit",async event=>{event.preventDefault();if(!requireLogin())return;const listing={title:$("listingTitle").value,category:$("listingCategory").value,price:$("listingPrice").value};if(isSupabaseMode()){const {error}=await supabaseClient.from("marketplace_items").insert({...listing,seller_id:currentUserId(),status:"active"});if(error)throw error;await loadMarketplace()}else{state.listings.unshift({id:wsmtUuid(),...listing,art:"consulting"});saveLocalState()}event.target.reset();render();toast("Listing added")});
on("businessForm","submit",async event=>{event.preventDefault();if(!requireLogin())return;const page={name:$("businessName").value,category:$("businessCategory").value,description:"Created from WSMT dashboard"};if(isSupabaseMode()){const {error}=await supabaseClient.from("business_pages").insert({...page,owner_id:currentUserId()});if(error)throw error;await loadBusinessPages()}else{state.businessPages.unshift({id:wsmtUuid(),...page});saveLocalState()}event.target.reset();render();toast("Business page saved")});
on("adForm","submit",async event=>{event.preventDefault();if(!requireLogin())return;const ad={name:$("adName").value,ad_type:$("adType").value,budget:$("adBudget").value,status:"review",result:"Pending"};if(isSupabaseMode()){const {error}=await supabaseClient.from("advertisements").insert({...ad,owner_id:currentUserId()});if(error)throw error;await loadAds()}else{state.ads.unshift({id:wsmtUuid(),name:ad.name,type:ad.ad_type,budget:ad.budget,status:"Review",result:"Pending"});saveLocalState()}event.target.reset();render();toast("Ad submitted for review")});
async function startCheckout(){if(CONFIG.CHECKOUT_ENDPOINT){const response=await fetch(CONFIG.CHECKOUT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({price:"wsmt_1_month",userId:currentUserId()||"guest"})});const data=await response.json();if(data.url)window.location.href=data.url;return}if(CONFIG.STRIPE_PAYMENT_LINK){window.location.href=CONFIG.STRIPE_PAYMENT_LINK;return}if(isSupabaseMode()){await supabaseClient.from("subscriptions").upsert({user_id:currentUserId(),status:"active"},{onConflict:"user_id"});await loadSubscription()}else{state.profile.membership="active";saveLocalState()}render();toast("Demo membership activated. Add Stripe checkout for live billing.")}
["stripeCheckoutButton","stripeCheckoutHero","stripeCheckoutRail"].forEach(id=>on(id,"click",event=>{logButtonClick(event.currentTarget.textContent.trim());startCheckout()}));
on("exportAdmin","click",()=>{logButtonClick("Export Report");const report=JSON.stringify({reports:state.reports,ads:state.ads,groups:state.groups,listings:state.listings},null,2);const blob=new Blob([report],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="wsmt-admin-report.json";link.click();URL.revokeObjectURL(link.href)});
on("globalSearch","input",event=>{const term=event.target.value.toLowerCase();document.querySelectorAll(".post,.feature-card,.listing,.table-row").forEach(card=>{card.style.display=!term||card.textContent.toLowerCase().includes(term)?"":"none"})});

console.log("App initialized");
(async function boot(){try{await initSupabase();render()}catch(error){console.error("App initialization failed",error);toast(error.message||"App initialization failed")}})();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootWsmtApp);
}else{
  bootWsmtApp();
}
