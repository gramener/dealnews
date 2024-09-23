import { render, html } from "https://cdn.jsdelivr.net/npm/lit-html@3/+esm";
import { parse } from "https://cdn.jsdelivr.net/npm/partial-json@0.1.7/+esm";
import { SSE } from "https://cdn.jsdelivr.net/npm/sse.js@2";
import { num0, wdmy } from "https://cdn.jsdelivr.net/npm/@gramex/ui/dist/format.js";

const { token } = await fetch("https://llmfoundry.straive.com/token", { credentials: "include" }).then((res) =>
  res.json()
);
const url = "https://llmfoundry.straive.com/login?" + new URLSearchParams({ next: location.href });
render(
  token
    ? html`<form class="narrative mx-auto my-5 d-flex align-items-center">
        <label for="source" class="form-label me-2 mb-0">Source</label>
        <input class="form-control me-2" list="sources" id="source" placeholder="Type to search or enter URL" />
        <datalist id="sources">
          <option value="https://www.pehub.com/">PE Hub</option>
          <option value="https://www.dealstreetasia.com/">Deal Street Asia</option>
          <option value="https://www.prnewswire.com/">PR Newswire</option>
          <option value="https://www.venturecapitaljournal.com/">Venture Capital Journal</option>
          <option value="https://yourstory.com/">Your Story</option>
          <option value="https://globallegalchronicle.com/">Globallegal Chronicle</option>
          <!-- option value="https://markets.businessinsider.com/">Business Insider</option -->
        </datalist>
        <button type="submit" class="btn btn-primary text-nowrap">Extract deals</button>
      </form>`
    : html`<div class="text-center my-5">
        <a class="btn btn-primary" href="${url}">Log in to try your own images</a>
      </div>`,
  document.getElementById("controls")
);

document.querySelector("form").addEventListener("submit", async (event) => {
  const result = document.getElementById("result");

  const status = (message) =>
    render(
      html`<div class="d-flex justify-content-center align-items-center">
        <div class="me-3">${message}</div>
        <div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>
      </div>`,
      result
    );

  event.preventDefault();
  const url = document.querySelector("#source").value;
  status("Downloading the page");
  const markdown = await fetch(
    `https://llmfoundry.straive.com/-/markdown?n=0&links&url=${encodeURIComponent(url)}`
  ).then((r) => r.text());

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}:dealnews` };
  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Extract deals from the following news article.
Return a JSON array of deals.
Use "" for missing information.`,
      },
      { role: "user", content: markdown },
    ],
    stream: true,
    stream_options: { include_usage: true },
    response_format: { type: "json_schema", json_schema: { name: "deals", strict: true, schema: dealSchema } },
    temperature: 0,
  };
  const source = new SSE("https://llmfoundry.straive.com/openai/v1/chat/completions", {
    headers,
    payload: JSON.stringify(body),
    start: false,
  });
  let content = "";
  source.addEventListener("message", (event) => {
    if (event.data == "[DONE]") return;
    const message = JSON.parse(event.data);
    const content_delta = message.choices?.[0]?.delta?.content;
    if (content_delta) content += content_delta;
    drawDeals({ content });
  });
  status("Extracting deals");
  source.stream();
});

function drawDeals({ content }) {
  const deals = parse(content || "{}").deals || [];
  const result = document.getElementById("result");

  const table = html`
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Link</th>
          <th>Investor</th>
          <th>Company</th>
          <th>Industry</th>
          <th>Date</th>
          <th>Advisors</th>
          <th>Complete</th>
          <th>Transaction Type</th>
          <th>Currency</th>
          <th>Deal Value</th>
        </tr>
      </thead>
      <tbody>
        ${deals.map(
          (deal) => html`
            <tr>
              <td><a href="${deal.URL}" target="_blank">Link</a></td>
              <td>${deal.Investor}</td>
              <td>${deal.Company}</td>
              <td>${deal.Industry}</td>
              <td>${dateFormat(deal.Date)}</td>
              <td>${deal.Advisors}</td>
              <td>${deal.Complete ? "Yes" : "No"}</td>
              <td>${deal["Transaction Type"]}</td>
              <td class="text-end">${deal.Currency}</td>
              <td class="text-end">${num0(deal["Deal Value"])}</td>
            </tr>
          `
        )}
      </tbody>
    </table>
  `;

  render(table, result);
}

const dealSchema = {
  type: "object",
  properties: {
    deals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          URL: {
            type: "string",
            description: "URL of the deal",
          },
          Investor: {
            type: "string",
            description: "Investing company, PE, or VC",
          },
          Company: {
            type: "string",
            description: "Company being invested in",
          },
          Industry: {
            type: "string",
            description: "Industry of the company",
          },
          Date: {
            type: "string",
            description: "Date of the deal, YYYY-MM-DD",
          },
          Advisors: {
            type: "string",
            description: "Advisors to the deal",
          },
          Complete: {
            type: "boolean",
            description: "True of deal is complete, false if pending",
          },
          "Transaction Type": {
            type: "string",
            description: "If PE, Buyout or Secondary buyout? If VC, which series funding? If PD, which type of loan?",
          },
          Currency: {
            type: "string",
            description: "3-letter currency of the deal (USD, GBP, etc.)",
          },
          "Deal Value": {
            type: "number",
            description: "Deal value in the specified currency. Convert millions to units",
          },
        },
        required: [
          "URL",
          "Investor",
          "Company",
          "Industry",
          "Date",
          "Advisors",
          "Complete",
          "Transaction Type",
          "Currency",
          "Deal Value",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["deals"],
  additionalProperties: false,
};

function dateFormat(date) {
  try {
    return wdmy(new Date(date));
  } catch {
    return date;
  }
}
