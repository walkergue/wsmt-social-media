const ENV = window.WSMT_ENV || {};
const CONFIG = {
  SUPABASE_URL: ENV.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: ENV.VITE_SUPABASE_ANON_KEY || "",
  STRIPE_PAYMENT_LINK: ENV.VITE_STRIPE_PAYMENT_LINK || "",
  CHECKOUT_ENDPOINT: ENV.VITE_CHECKOUT_ENDPOINT || ""
};
const seed = {
  session: null,
  profile: { displayName: "Guest", accountType: "Creator", location: "", website: "", bio: "", membership: "inactive" },
  posts: [
    { id: crypto.randomUUID(), author: "Marisol Bennett", role: "Founder at GreenPath Supply - Sponsored", body: "Launching wholesale eco packaging for local restaurants this month. Members can book a supplier call and get marketplace placement.", likes: 28, comments: 7, shares: 4, saved: false, accent: "accent" },
    { id: crypto.randomUUID(), author: "Jordan Lee", role: "Creator community - Trending", body: "Our weekly creator sprint starts Friday. Bring one offer, one customer question, and one post draft.", likes: 64, comments: 18, shares: 11, saved: false, accent: "gold" }
  ],
  groups: [
    { id: crypto.randomUUID(), name: "Local Business Builders", description: "Promotions, vendor leads, and weekly accountability discussions.", members: 18400, joined: false },
    { id: crypto.randomUUID(), name: "Investor Introductions", description: "Founder updates, pitch practice, and moderated deal conversations.", members: 6100, joined: false },
    { id: crypto.randomUUID(), name: "Creator Growth Lab", description: "Content experiments, audience insights, and scheduled posting workflows.", members: 24700, joined: false }
  ],
  listings: [
    { id: crypto.randomUUID(), title: "Brand Launch Consulting", category: "Services", price: "$450", art: "consulting" },
    { id: crypto.randomUUID(), title: "Shared Office Suite", category: "Real estate", price: "$1,200/mo", art: "office" },
    { id: crypto.randomUUID(), title: "Creator Video Kit", category: "Products", price: "$690", art: "camera" },
    { id: crypto.randomUUID(), title: "Sales Associate Role", category: "Jobs", price: "Full-time", art: "hiring" }
  ],
  ads: [
    { id: crypto.randomUUID(), name: "Downtown Job Fair", type: "Event", status: "Active", result: "341 signups", budget: "$800" },
    { id: crypto.randomUUID(), name: "Starter CRM Offer", type: "Service", status: "Active", result: "96 leads", budget: "$450" },
    { id: crypto.randomUUID(), name: "Open House Weekend", type: "Real estate", status: "Review", result: "Pending", budget: "$300" }
  ],
  reports: [
    { item: "Subscription dispute", priority: "High", owner: "Billing", status: "Open" },
    { item: "Reported marketplace item", priority: "Medium", owner: "Trust", status: "Reviewing" },
    { item: "Verification request", priority: "Low", owner: "Support", status: "Queued" }
  ]
};
let state = loadState();
let supabaseClient = null;
function storageKey(){return "wsmt-social-mvp"}
function loadState(){const saved=localStorage.getItem(storageKey());return saved?JSON.parse(saved):structuredClone(seed)}
function saveState(){localStorage.setItem(storageKey(),JSON.stringify(state))}
function $(id){return document.getElementById(id)}
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function currentName(){return state.profile.displayName||state.session?.email?.split("@")[0]||"Guest"}
function initial(name){return(name||"G").trim().charAt(0).toUpperCase()}
function initSupabase(){if(CONFIG.SUPABASE_URL&&CONFIG.SUPABASE_ANON_KEY&&window.supabase){supabaseClient=window.supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY);$("storageStatus").textContent="Supabase connected";$("supabaseState").textContent="Connected. Auth and table writes will use your Supabase project."}else{$("storageStatus").textContent="Local demo storage";$("supabaseState").textContent="Local demo mode is active. Add SUPABASE_URL and SUPABASE_ANON_KEY in app.js to use database storage."}}
function showView(viewName){document.querySelectorAll(".nav-item").forEach(nav=>nav.classList.toggle("active",nav.dataset.view===viewName));document.querySelectorAll(".view").forEach(view=>view.classList.toggle("active",view.id===viewName+"-view"));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav-item").forEach(item=>item.addEventListener("click",()=>showView(item.dataset.view)));
document.querySelectorAll("[data-view-shortcut]").forEach(button=>button.addEventListener("click",()=>showView(button.dataset.viewShortcut)));
async function auth(intent,email,password){if(supabaseClient){const result=intent==="signup"?await supabaseClient.auth.signUp({email,password}):await supabaseClient.auth.signInWithPassword({email,password});if(result.error)throw result.error;state.session={email,userId:result.data.user?.id||result.data.session?.user?.id||email}}else{state.session={email,userId:email}}if(!state.profile.displayName||state.profile.displayName==="Guest")state.profile.displayName=email.split("@")[0];saveState();render()}
async function saveRecord(table,record){if(!supabaseClient)return;const{error}=await supabaseClient.from(table).upsert(record);if(error)console.warn(error.message)}
function render(){const name=currentName();$("profileNameTop").textContent=name;$("profileInitial").textContent=initial(name);$("composerInitial").textContent=initial(name);$("membershipBadge").textContent=state.profile.membership==="active"?"$1/month active":"Membership inactive";$("displayName").value=state.profile.displayName||"";$("accountType").value=state.profile.accountType||"Creator";$("location").value=state.profile.location||"";$("website").value=state.profile.website||"";$("bio").value=state.profile.bio||"";renderMetrics();renderPosts();renderSaved();renderGroups();renderListings();renderAds();renderAdmin()}
function metric(label,value){return '<article class="metric"><span>'+label+'</span><strong>'+value+'</strong></article>'}
function renderMetrics(){const subscribers=state.profile.membership==="active"?41937:41936;$("homeMetrics").innerHTML=metric("Members","42,800")+metric("Active subscribers",subscribers.toLocaleString())+metric("Monthly recurring revenue","$"+subscribers.toLocaleString())+metric("Open reports",state.reports.length)}
function renderPosts(){$("postList").innerHTML=state.posts.map(post=>'<article class="post"><div class="post-top"><div class="avatar '+(post.accent||"")+'">'+initial(post.author)+'</div><div><strong>'+escapeHtml(post.author)+'</strong><span>'+escapeHtml(post.role)+'</span></div></div><p>'+escapeHtml(post.body)+'</p>'+(post.author==="Marisol Bennett"?'<div class="media-preview packaging"></div>':'')+'<div class="post-actions"><button type="button" data-action="like" data-id="'+post.id+'">Like '+post.likes+'</button><button type="button" data-action="comment" data-id="'+post.id+'">Comment '+post.comments+'</button><button type="button" data-action="share" data-id="'+post.id+'">Share '+post.shares+'</button><button type="button" data-action="save" data-id="'+post.id+'">'+(post.saved?"Saved":"Bookmark")+'</button></div></article>').join("")}
function renderSaved(){const saved=state.posts.filter(post=>post.saved);$("savedList").innerHTML=saved.length?saved.map(post=>'<article class="post"><div class="post-top"><div class="avatar">'+initial(post.author)+'</div><div><strong>'+escapeHtml(post.author)+'</strong><span>Saved post</span></div></div><p>'+escapeHtml(post.body)+'</p></article>').join(""):'<section class="panel"><h2>No saved posts yet</h2><p>Bookmark posts from the feed to collect them here.</p></section>'}
function renderGroups(){$("groupList").innerHTML=state.groups.map(group=>'<article class="feature-card"><strong>'+escapeHtml(group.name)+'</strong><span>'+group.members.toLocaleString()+' members</span><p>'+escapeHtml(group.description)+'</p><div class="button-row"><button class="secondary-button" data-action="join-group" data-id="'+group.id+'" type="button">'+(group.joined?"Joined":"Join")+'</button></div></article>').join("")}
function renderListings(){$("listingList").innerHTML=state.listings.map(listing=>'<article class="listing"><div class="listing-art '+(listing.art||"consulting")+'"></div><strong>'+escapeHtml(listing.title)+'</strong><span>'+escapeHtml(listing.category)+' - '+escapeHtml(listing.price)+'</span><div class="button-row"><button class="secondary-button" type="button">Message Seller</button></div></article>').join("")}
function renderAds(){const spend=state.ads.reduce((sum,ad)=>sum+Number(String(ad.budget).replace(/[^0-9.]/g,"")||0),0);$("adMetrics").innerHTML=metric("Spend","$"+spend.toLocaleString())+metric("Campaigns",state.ads.length)+metric("Leads","1,928")+metric("CTR","3.8%");$("adTable").innerHTML='<div class="table-row table-head"><span>Campaign</span><span>Type</span><span>Status</span><span>Result</span></div>'+state.ads.map(ad=>'<div class="table-row"><span>'+escapeHtml(ad.name)+'</span><span>'+escapeHtml(ad.type)+'</span><span>'+escapeHtml(ad.status)+'</span><span>'+escapeHtml(ad.result)+'</span></div>').join("")}
function renderAdmin(){const subscribers=state.profile.membership==="active"?41937:41936;$("adminMetrics").innerHTML=metric("Total users","42,800")+metric("Active subscribers",subscribers.toLocaleString())+metric("MRR","$"+subscribers.toLocaleString())+metric("Pending reports",state.reports.length);$("moderationQueue").innerHTML='<div class="table-row table-head"><span>Moderation queue</span><span>Priority</span><span>Owner</span><span>Status</span></div>'+state.reports.map(report=>'<div class="table-row"><span>'+escapeHtml(report.item)+'</span><span>'+escapeHtml(report.priority)+'</span><span>'+escapeHtml(report.owner)+'</span><span>'+escapeHtml(report.status)+'</span></div>').join("")}
function escapeHtml(value){return String(value).replace(/[&<>"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[char]))}
$("authForm").addEventListener("submit",async event=>{event.preventDefault();const intent=event.submitter.value;try{await auth(intent,$("authEmail").value,$("authPassword").value);$("authMessage").textContent="Signed in as "+state.session.email;toast("Account ready");showView("profile")}catch(error){$("authMessage").textContent=error.message;toast(error.message)}});
$("signOutButton").addEventListener("click",async()=>{if(supabaseClient)await supabaseClient.auth.signOut();state.session=null;saveState();render();toast("Logged out")});
$("profileForm").addEventListener("submit",async event=>{event.preventDefault();state.profile={...state.profile,displayName:$("displayName").value,accountType:$("accountType").value,location:$("location").value,website:$("website").value,bio:$("bio").value};saveState();await saveRecord("profiles",{id:state.session?.userId||"local-user",...state.profile});render();toast("Profile saved")});
$("composer").addEventListener("submit",async event=>{event.preventDefault();const body=$("postText").value.trim();if(!body)return;const post={id:crypto.randomUUID(),author:currentName(),role:(state.profile.accountType||"Member")+" - Just now",body,likes:0,comments:0,shares:0,saved:false};state.posts.unshift(post);$("postText").value="";saveState();await saveRecord("posts",post);render();toast("Post published")});
document.addEventListener("click",async event=>{const button=event.target.closest("button[data-action]");if(!button)return;const id=button.dataset.id;if(button.dataset.action==="like")state.posts.find(p=>p.id===id).likes++;if(button.dataset.action==="comment")state.posts.find(p=>p.id===id).comments++;if(button.dataset.action==="share")state.posts.find(p=>p.id===id).shares++;if(button.dataset.action==="save"){const post=state.posts.find(p=>p.id===id);post.saved=!post.saved;await saveRecord("saved_posts",{id:crypto.randomUUID(),post_id:id,user_id:state.session?.userId||"local-user"})}if(button.dataset.action==="join-group"){const group=state.groups.find(g=>g.id===id);group.joined=!group.joined;group.members+=group.joined?1:-1}saveState();render()});
$("groupForm").addEventListener("submit",async event=>{event.preventDefault();const group={id:crypto.randomUUID(),name:$("groupName").value,description:$("groupDescription").value,members:1,joined:true};state.groups.unshift(group);event.target.reset();saveState();await saveRecord("groups",group);render();toast("Group created")});
$("listingForm").addEventListener("submit",async event=>{event.preventDefault();const listing={id:crypto.randomUUID(),title:$("listingTitle").value,category:$("listingCategory").value,price:$("listingPrice").value,art:"consulting"};state.listings.unshift(listing);event.target.reset();saveState();await saveRecord("marketplace_listings",listing);render();toast("Listing added")});
$("adForm").addEventListener("submit",async event=>{event.preventDefault();const ad={id:crypto.randomUUID(),name:$("adName").value,type:$("adType").value,budget:$("adBudget").value,status:"Review",result:"Pending"};state.ads.unshift(ad);event.target.reset();saveState();await saveRecord("ads",ad);render();toast("Ad submitted for review")});
async function startCheckout(){if(CONFIG.CHECKOUT_ENDPOINT){const response=await fetch(CONFIG.CHECKOUT_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({price:"wsmt_1_month",userId:state.session?.userId||"guest"})});const data=await response.json();if(data.url)window.location.href=data.url;return}if(CONFIG.STRIPE_PAYMENT_LINK){window.location.href=CONFIG.STRIPE_PAYMENT_LINK;return}state.profile.membership="active";saveState();render();toast("Demo membership activated. Add Stripe config for live checkout.")}
["stripeCheckoutButton","stripeCheckoutHero","stripeCheckoutRail"].forEach(id=>$(id).addEventListener("click",startCheckout));
$("exportAdmin").addEventListener("click",()=>{const report=JSON.stringify({metrics:{users:42800,subscribers:41936,mrr:41936},reports:state.reports,ads:state.ads},null,2);const blob=new Blob([report],{type:"application/json"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download="wsmt-admin-report.json";link.click();URL.revokeObjectURL(link.href)});
$("globalSearch").addEventListener("input",event=>{const term=event.target.value.toLowerCase();document.querySelectorAll(".post,.feature-card,.listing,.table-row").forEach(card=>{card.style.display=!term||card.textContent.toLowerCase().includes(term)?"":"none"})});
initSupabase();
render();