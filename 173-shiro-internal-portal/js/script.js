const data = [
  { title: "クロージング話法の基本", category: "営業", url: "./pages/sales.html" },
  { title: "失注後のフォロー手順", category: "営業", url: "./pages/sales.html#knowledge" },
  { title: "Claude活用法（提案文ドラフト）", category: "AI", url: "./pages/ai.html" },
  { title: "ChatGPT活用法（FAQ自動生成）", category: "AI", url: "./pages/ai.html" },
  { title: "LP向け研修動画 01: 初回面談", category: "研修", url: "./pages/training.html" },
  { title: "LP向け研修動画 02: 提案準備", category: "研修", url: "./pages/training.html" },
  { title: "FAQ: 価格訴求の切り返し", category: "FAQ", url: "./pages/training.html#faq" },
  { title: "OneTeam: 支社成功パターン集", category: "ナレッジ", url: "./pages/sales.html#knowledge" }
];

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const resultsList = document.getElementById("searchResults");

function renderResults(items) {
  resultsList.textContent = "";

  if (items.length === 0) {
    const empty = document.createElement("li");
    empty.textContent = "該当するコンテンツが見つかりませんでした。";
    resultsList.append(empty);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    const title = document.createElement("a");
    const category = document.createElement("span");

    title.textContent = item.title;
    title.href = item.url;
    category.textContent = item.category;
    category.className = "category";

    li.append(title, category);
    resultsList.append(li);
  }
}

function filterResults() {
  const keyword = searchInput.value.trim().toLowerCase();
  const selectedCategory = categoryFilter.value;

  const matched = data.filter((item) => {
    const keywordMatch =
      keyword.length === 0 ||
      item.title.toLowerCase().includes(keyword) ||
      item.category.toLowerCase().includes(keyword);

    const categoryMatch =
      selectedCategory === "all" || item.category === selectedCategory;

    return keywordMatch && categoryMatch;
  });

  renderResults(matched);
}

searchInput.addEventListener("input", filterResults);
categoryFilter.addEventListener("change", filterResults);

renderResults(data);
