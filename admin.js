const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

let inventory = [];
let inventoryLoading = false;
let generating = false;
let resourceConfig = [];
let resourcesLoading = false;
let extraResourceLoading = false;
let extraResourceSaving = false;
const savingResourceRoles = new Set();
const defaultExtraResource = {
  resource_key: "more-projects",
  title: "更多热门项目合集",
  description: "如果觉得以上三个项目都没有合适的，可以看看我们整理好的几百个热门项目，希望对你有帮助。",
  button_label: "查看热门项目合集",
  resource_url: "",
  access_code: "",
  is_enabled: false,
};

const resultDefinitions = [
  { role: "organizer", title: "AI办公提效师", projects: [["organize", "AI赋能办公进阶课"], ["support", "图片表格识别提取工具"], ["workflow", "精美PPT案例实操"]] },
  { role: "content", title: "内容增长策划师", projects: [["copy", "爆款内容IP增长实战"], ["affiliate", "AI带货视频从0到1"], ["visual", "剧本文案与短视频内容"]] },
  { role: "visual", title: "短视频视觉创作者", projects: [["visual", "AI视频全能王"], ["organize", "短视频/图片/动图无水印下载工具"], ["copy", "精美PPT案例实操"]] },
  { role: "workflow", title: "AI自动化流程师", projects: [["workflow", "Coze智能体训练营"], ["organize", "财务审计自动化"], ["support", "豆包电脑办公任务拉新3"]] },
  { role: "connector", title: "引流成交运营师", projects: [["affiliate", "抖音评论区群聊玩法"], ["local", "外贸从0-1出海实战"], ["copy", "强付费转化特训课"]] },
  { role: "executor", title: "实体商家运营师", projects: [["local", "实体商家商业IP打造"], ["support", "陪诊师获客实操"], ["affiliate", "抖音电商操盘实战"]] },
  { role: "portfolio", title: "知识产品设计师", projects: [["portfolio", "课程开发实战"], ["copy", "知识IP变现营"], ["affiliate", "AI虚拟产品训练营"]] },
  { role: "explorer", title: "副业项目探索者", projects: [["affiliate", "小红书虚拟电商1拖3"], ["portfolio", "人生系统思维"], ["visual", "AI小说暴利搞钱项目"]] },
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

function renderExtraResourceConfig(resource = defaultExtraResource) {
  const form = $("#extra-resource-form");
  ["title", "description", "button_label", "resource_url", "access_code"].forEach((field) => {
    form.querySelector(`[data-extra-field='${field}']`).value = resource[field] || "";
  });
  form.querySelector("[data-extra-field='is_enabled']").checked = Boolean(resource.is_enabled);
}

async function loadExtraResourceConfig() {
  if (extraResourceLoading) return;
  extraResourceLoading = true;
  const status = $("#extra-resource-status");
  status.textContent = "正在加载更多热门项目配置…";
  try {
    const { data, error } = await client().from("report_extra_resources")
      .select("*").eq("resource_key", "more-projects").maybeSingle();
    if (error) throw error;
    renderExtraResourceConfig(data || defaultExtraResource);
    status.textContent = "配置已载入 · 更新于 " + formatDate(new Date().toISOString());
  } catch (error) {
    renderExtraResourceConfig();
    status.textContent = "配置加载失败，请先执行 supabase-migration-v4.sql：" + (error.message || "连接失败");
  } finally {
    extraResourceLoading = false;
  }
}

async function saveExtraResourceConfig() {
  if (extraResourceSaving) return;
  const form = $("#extra-resource-form");
  const value = (field) => form.querySelector(`[data-extra-field='${field}']`).value.trim();
  const resourceUrl = value("resource_url");
  const enabled = form.querySelector("[data-extra-field='is_enabled']").checked;
  if (!value("title")) throw new Error("板块标题不能为空。");
  if (!value("description")) throw new Error("说明文字不能为空。");
  if (!value("button_label")) throw new Error("按钮文字不能为空。");
  if (resourceUrl && !/^https:\/\//i.test(resourceUrl)) throw new Error("百度网盘链接必须以 https:// 开头。");
  if (enabled && !resourceUrl) throw new Error("已勾选启用，请先填写百度网盘链接。");
  const record = {
    resource_key: "more-projects", title: value("title"), description: value("description"),
    button_label: value("button_label"), resource_url: resourceUrl || null,
    access_code: value("access_code"), is_enabled: enabled, updated_at: new Date().toISOString(),
  };
  extraResourceSaving = true;
  const button = $("#extra-resource-save-button");
  button.disabled = true;
  try {
    const { data, error } = await client().from("report_extra_resources")
      .upsert(record, { onConflict: "resource_key" }).select().single();
    if (error) throw error;
    renderExtraResourceConfig(data || record);
    $("#extra-resource-status").textContent = "更多热门项目配置已保存。";
    showToast("更多热门项目配置已保存");
  } finally {
    extraResourceSaving = false;
    button.disabled = false;
  }
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
  await Promise.all([loadInventory(), loadResourceConfig(), loadExtraResourceConfig()]);
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
$("#extra-resource-save-button").addEventListener("click", () => saveExtraResourceConfig().catch((error) => showToast(error.message)));
$("#copy-button").addEventListener("click", () => copyAvailableCodes().catch((error) => showToast(error.message)));
$("#csv-button").addEventListener("click", () => exportCodes("csv"));
$("#txt-button").addEventListener("click", () => exportCodes("txt"));
$("#code-search").addEventListener("input", renderInventory);
$("#code-status").addEventListener("change", renderInventory);

init();
