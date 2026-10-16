const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let inventory = [];
let inventoryLoading = false;
let generating = false;
let resourceConfig = [];
let resourcesLoading = false;
const savingResourceRoles = new Set();

const resultDefinitions = [
  { role: "organizer", title: "资料炼金师", projects: [["organize", "资料整理与工具清单"], ["support", "文档排版与虚拟助理"], ["workflow", "表格、模板与 AI 工作流"]] },
  { role: "content", title: "内容翻译官", projects: [["copy", "商品文案与短内容"], ["portfolio", "目标岗位作品集"], ["affiliate", "合规内容联盟推广"]] },
  { role: "visual", title: "视觉改造师", projects: [["visual", "商品图与基础剪辑"], ["copy", "商品文案与短内容"], ["portfolio", "目标岗位作品集"]] },
  { role: "workflow", title: "流程搭建师", projects: [["workflow", "表格、模板与 AI 工作流"], ["organize", "资料整理与工具清单"], ["support", "文档排版与虚拟助理"]] },
  { role: "connector", title: "需求捕手", projects: [["local", "本地商家内容代发"], ["copy", "商品文案与短内容"], ["affiliate", "合规内容联盟推广"]] },
  { role: "executor", title: "稳定交付官", projects: [["support", "文档排版与虚拟助理"], ["organize", "资料整理与工具清单"], ["visual", "商品图与基础剪辑"]] },
  { role: "portfolio", title: "作品突围者", projects: [["portfolio", "目标岗位作品集"], ["visual", "商品图与基础剪辑"], ["copy", "商品文案与短内容"]] },
  { role: "explorer", title: "探索试跑者", projects: [["organize", "资料整理与工具清单"], ["copy", "商品文案与短内容"], ["visual", "商品图与基础剪辑"]] },
];

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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
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

function normalizedResourceRows(definition) {
  return definition.projects.map(([projectId, defaultTitle], index) => {
    const stored = resourceConfig.find((item) => item.result_role === definition.role && Number(item.slot) === index + 1);
    return stored || {
      result_role: definition.role, slot: index + 1, project_id: projectId, title: defaultTitle,
      resource_url: "", access_code: "", is_enabled: false,
    };
  });
}

function renderResourceConfig() {
  $("#resource-config-list").innerHTML = resultDefinitions.map((definition) => {
    const rows = normalizedResourceRows(definition);
    const slots = rows.map((row, index) =>
      '<div class="resource-slot-row" data-resource-slot="' + (index + 1) + '">' +
        '<span class="resource-slot-number">资料 ' + (index + 1) + '</span>' +
        '<label class="resource-field"><span>项目名称</span><input class="text-input" data-resource-field="title" maxlength="100" value="' + escapeHtml(row.title) + '" /></label>' +
        '<label class="resource-field"><span>百度网盘链接（必须以 https:// 开头）</span><input class="text-input" data-resource-field="resource_url" type="url" placeholder="https://pan.baidu.com/s/..." value="' + escapeHtml(row.resource_url || "") + '" /></label>' +
        '<label class="resource-field"><span>提取码</span><input class="text-input" data-resource-field="access_code" maxlength="32" value="' + escapeHtml(row.access_code || "") + '" /></label>' +
        '<label class="resource-enabled"><input data-resource-field="is_enabled" type="checkbox" ' + (row.is_enabled ? "checked" : "") + ' />启用</label>' +
      '</div>').join("");
    return '<section class="resource-result-block" data-resource-role="' + definition.role + '">' +
      '<div class="resource-result-head"><div><h3>' + definition.title + '</h3><p>结果标识：' + definition.role + ' · 固定 3 个资料位</p></div>' +
      '<button class="secondary-button resource-save-button" data-save-resources="' + definition.role + '" type="button">保存这组</button></div>' +
      '<div class="resource-slot-grid">' + slots + '</div></section>';
  }).join("");
  $$('[data-save-resources]').forEach((button) => button.addEventListener("click", () => {
    saveResourceGroup(button.dataset.saveResources).catch((error) => showToast(error.message));
  }));
}

async function loadResourceConfig() {
  if (resourcesLoading) return;
  resourcesLoading = true;
  const button = $("#resource-refresh-button");
  const status = $("#resource-status");
  button.disabled = true;
  status.textContent = "正在加载结果资料配置…";
  try {
    const { data, error } = await client().from("result_resources").select("*").order("result_role", { ascending: true });
    if (error) throw error;
    resourceConfig = data || [];
    renderResourceConfig();
    status.textContent = "已载入 8 种结果、24 个资料位 · 更新于 " + formatDate(new Date().toISOString());
  } catch (error) {
    status.textContent = "资料配置加载失败：" + (error.message || "连接失败");
    throw error;
  } finally {
    resourcesLoading = false;
    button.disabled = false;
  }
}

async function saveResourceGroup(role) {
  if (savingResourceRoles.has(role)) return;
  const definition = resultDefinitions.find((item) => item.role === role);
  const block = $("[data-resource-role='" + role + "']");
  if (!definition || !block) return;
  const rows = [...block.querySelectorAll("[data-resource-slot]")].map((row, index) => {
    const resourceUrl = row.querySelector("[data-resource-field='resource_url']").value.trim();
    const enabled = row.querySelector("[data-resource-field='is_enabled']").checked;
    if (resourceUrl && !/^https:\/\//i.test(resourceUrl)) throw new Error("资料 " + (index + 1) + " 的链接必须以 https:// 开头。");
    if (enabled && !resourceUrl) throw new Error("资料 " + (index + 1) + " 已启用，请先填写链接。");
    return {
      result_role: role, slot: index + 1, project_id: definition.projects[index][0],
      title: row.querySelector("[data-resource-field='title']").value.trim(),
      resource_url: resourceUrl || null,
      access_code: row.querySelector("[data-resource-field='access_code']").value.trim(),
      is_enabled: enabled, updated_at: new Date().toISOString(),
    };
  });
  if (rows.some((row) => !row.title)) throw new Error("项目名称不能为空。");
  savingResourceRoles.add(role);
  const button = block.querySelector("[data-save-resources]");
  button.disabled = true;
  try {
    const { data, error } = await client().from("result_resources").upsert(rows, { onConflict: "result_role,slot" }).select();
    if (error) throw error;
    resourceConfig = resourceConfig.filter((item) => item.result_role !== role).concat(data || rows);
    $("#resource-status").textContent = definition.title + "的 3 个资料位已保存。";
    showToast(definition.title + "资料配置已保存");
  } finally {
    savingResourceRoles.delete(role);
    const currentButton = $("[data-save-resources='" + role + "']");
    if (currentButton) currentButton.disabled = false;
  }
}

async function loadDashboard() {
  await Promise.all([loadInventory(), loadResourceConfig()]);
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
    await loadDashboard();
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
    try { await loadDashboard(); } catch (error) { showToast(error.message); }
  }
  client().auth.onAuthStateChange((_event, session) => setLoggedIn(session));
}

$("#login-button").addEventListener("click", () => login().catch((error) => { $("#login-error").textContent = error.message; }));
$("#password").addEventListener("keydown", (event) => { if (event.key === "Enter") login(); });
$("#logout-button").addEventListener("click", async () => { await client().auth.signOut(); setLoggedIn(null); });
$("#generate-button").addEventListener("click", () => generateCodes().catch((error) => showToast(error.message)));
$("#refresh-button").addEventListener("click", () => loadInventory().catch((error) => showToast(error.message)));
$("#resource-refresh-button").addEventListener("click", () => loadResourceConfig().catch((error) => showToast(error.message)));
$("#copy-button").addEventListener("click", () => copyAvailableCodes().catch((error) => showToast(error.message)));
$("#csv-button").addEventListener("click", () => exportCodes("csv"));
$("#txt-button").addEventListener("click", () => exportCodes("txt"));
$("#code-search").addEventListener("input", renderInventory);
$("#code-status").addEventListener("change", renderInventory);

init();
