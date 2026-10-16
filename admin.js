const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let inventory = [];
let inventoryLoading = false;
let generating = false;

function client() {
  return window.getSupabaseClient?.();
}

function configured() {
  return Boolean(client());
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

function formatDate(iso) {
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

function setLoggedIn(session) {
  const loggedIn = Boolean(session);
  $("#login-card").hidden = loggedIn;
  $("#dashboard").hidden = !loggedIn;
  $("#logout-button").hidden = !loggedIn;
  $("#session-email").textContent = session?.user?.email || "";
}

async function loadInventory() {
  if (inventoryLoading) return;
  inventoryLoading = true;
  const refreshButton = $("#refresh-button");
  const status = $("#inventory-status");
  refreshButton.disabled = true;
  status.textContent = "正在加载…";
  try {
    const { data, error } = await client().from("access_codes").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    inventory = data || [];
    renderInventory();
    status.textContent = `已载入 ${inventory.length} 个测评码 · 更新于 ${formatDate(new Date().toISOString())}`;
  } catch (error) {
    status.textContent = `刷新失败：${error.message || "连接失败"}`;
    throw error;
  } finally {
    inventoryLoading = false;
    refreshButton.disabled = false;
  }
}

function renderInventory() {
  const search = ($("#code-search").value || "").trim().toUpperCase();
  const status = $("#code-status").value;
  const filtered = inventory.filter((record) => {
    const remaining = Math.max(0, record.max_uses - record.used_count);
    const matchesSearch = !search || record.code.includes(search);
    const matchesStatus = status === "all" || (status === "available" && remaining > 0) || (status === "used" && remaining === 0);
    return matchesSearch && matchesStatus;
  });

  const available = inventory.filter((record) => record.used_count < record.max_uses);
  $("#stat-total").textContent = inventory.length;
  $("#stat-available").textContent = available.length;
  $("#stat-uses").textContent = inventory.reduce((sum, record) => sum + Math.max(0, record.max_uses - record.used_count), 0);
  $("#stat-used").textContent = inventory.reduce((sum, record) => sum + record.used_count, 0);
  $("#code-table-body").innerHTML = filtered.map((record) => {
    const remaining = Math.max(0, record.max_uses - record.used_count);
    return `<tr>
      <td><strong class="code-value">${record.code}</strong></td>
      <td>${remaining}</td>
      <td>${record.used_count}</td>
      <td><span class="code-status ${remaining ? "available" : "used"}">${remaining ? "可使用" : "已用完"}</span></td>
      <td>${formatDate(record.created_at)}</td>
      <td><button class="table-copy" data-copy-code="${record.code}" type="button">复制</button></td>
    </tr>`;
  }).join("");
  $("#empty-state").hidden = filtered.length > 0;
  $$("[data-copy-code]").forEach((button) => button.addEventListener("click", async () => {
    await copyText(button.dataset.copyCode);
    showToast(`${button.dataset.copyCode} 已复制`);
  }));
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function generateCodes() {
  if (generating || inventoryLoading) return;
  generating = true;
  $("#generate-button").disabled = true;
  try {
    const count = Math.min(500, Math.max(1, Math.trunc(Number($("#generate-count").value) || 1)));
    const prefix = ($("#generate-prefix").value || "TRY").toUpperCase();
    const { error } = await client().rpc("generate_access_codes", {
      p_count: count,
      p_prefix: prefix,
      p_max_uses: 2,
    });
    if (error) throw error;
    await loadInventory();
    showToast(`已生成 ${count} 个测评码，每个可用 2 次`);
  } finally { generating = false; $("#generate-button").disabled = false; }
}

async function copyAvailableCodes() {
  const codes = inventory.filter((record) => record.used_count < record.max_uses).map((record) => record.code);
  if (!codes.length) {
    showToast("当前没有可用测评码");
    return;
  }
  await copyText(codes.join("\n"));
  showToast(`已复制 ${codes.length} 个可用测评码`);
}

function exportCodes(format) {
  const rows = inventory.map((record) => [
    record.code,
    record.max_uses,
    record.used_count,
    Math.max(0, record.max_uses - record.used_count),
    record.used_count < record.max_uses ? "可使用" : "已用完",
    formatDate(record.created_at),
  ]);
  if (format === "txt") {
    downloadText(inventory.filter((record) => record.used_count < record.max_uses).map((record) => record.code).join("\n"), `副业试跑站-可用测评码-${Date.now()}.txt`, "text/plain;charset=utf-8");
    return;
  }
  const csv = "\uFEFF" + [
    ["测评码", "最大次数", "已用次数", "剩余次数", "状态", "生成时间"],
    ...rows,
  ].map((row) => row.map((item) => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadText(csv, `副业试跑站-测评码库-${Date.now()}.csv`, "text/csv;charset=utf-8");
}

async function login() {
  $("#login-error").textContent = "";
  if (!configured()) {
    $("#login-error").textContent = "请先在 supabase-config.js 填入项目参数。";
    return;
  }
  const { data, error } = await client().auth.signInWithPassword({
    email: $("#email").value.trim(),
    password: $("#password").value,
  });
  if (error) {
    $("#login-error").textContent = "登录失败，请检查邮箱、密码和管理员权限。";
    return;
  }
  setLoggedIn(data.session);
  try {
    await loadInventory();
  } catch (loadError) {
    $("#login-error").textContent = loadError.message;
    await client().auth.signOut();
    setLoggedIn(null);
  }
}

async function init() {
  if (!configured()) {
    $("#login-error").textContent = "尚未配置 Supabase。请先填写 supabase-config.js。";
    return;
  }
  const { data } = await client().auth.getSession();
  setLoggedIn(data.session);
  if (data.session) {
    try { await loadInventory(); } catch (error) { showToast(error.message); }
  }
  client().auth.onAuthStateChange((_event, session) => setLoggedIn(session));
}

$("#login-button").addEventListener("click", () => login().catch((error) => { $("#login-error").textContent = error.message; }));
$("#password").addEventListener("keydown", (event) => { if (event.key === "Enter") login(); });
$("#logout-button").addEventListener("click", async () => { await client().auth.signOut(); setLoggedIn(null); });
$("#generate-button").addEventListener("click", () => generateCodes().catch((error) => showToast(error.message)));
$("#refresh-button").addEventListener("click", () => loadInventory().catch((error) => showToast(error.message)));
$("#copy-button").addEventListener("click", () => copyAvailableCodes().catch((error) => showToast(error.message)));
$("#csv-button").addEventListener("click", () => exportCodes("csv"));
$("#txt-button").addEventListener("click", () => exportCodes("txt"));
$("#code-search").addEventListener("input", renderInventory);
$("#code-status").addEventListener("change", renderInventory);

init();
