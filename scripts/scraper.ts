import { chromium } from "playwright";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const geminiApiKey = process.env.PUBLIC_GEMINI_API_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

interface Job {
  title: string;
  company: string;
  location: string;
  salary_range: string;
  description: string;
  apply_url: string;
  source: string;
}

const KEYWORDS = [
  "AI automation",
  "Make.com",
  "Zapier",
  "n8n",
  "LangChain",
  "automation specialist",
  "no-code",
];

const RELEVANCE_PROMPT = `
You are a job board curator for AI & No-Code automation experts (Make.com, Zapier, n8n, LangChain specialists).

Analyze this job posting and determine if it's relevant to our niche:
Title: {title}
Company: {company}
Description: {description}

Respond with a JSON object:
{
  "is_relevant": boolean,
  "confidence": number (0-100),
  "reason": "brief explanation"
}

Consider a job relevant if it involves: Make, Zapier, n8n, LangChain, AI automation, workflow automation, no-code platforms, or similar automation tools.
`;

const SUMMARY_PROMPT = `
Create a compelling 2-3 sentence summary for this job posting that would appeal to AI & No-Code automation specialists:

Title: {title}
Company: {company}
Description: {description}

Summary:`;

const TAGS_PROMPT = `
Extract relevant tags from this job posting. Return a JSON array of tags.
Consider these tags: ["Make", "Zapier", "n8n", "LangChain", "AI", "Automation", "No-Code", "Workflow", "Python", "Node.js", "APIs"]

Title: {title}
Description: {description}

Return only a JSON array, example: ["Make", "AI", "Automation"]
`;

async function validateJobWithGemini(job: Job): Promise<{
  is_relevant: boolean;
  reason: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = RELEVANCE_PROMPT.replace("{title}", job.title)
      .replace("{company}", job.company)
      .replace("{description}", job.description.substring(0, 500));

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { is_relevant: false, reason: "Could not parse response" };
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      is_relevant: result.is_relevant,
      reason: result.reason,
    };
  } catch (error) {
    console.error("Error validating job:", error);
    return { is_relevant: false, reason: "API error" };
  }
}

async function generateSummaryWithGemini(job: Job): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = SUMMARY_PROMPT.replace("{title}", job.title)
      .replace("{company}", job.company)
      .replace("{description}", job.description.substring(0, 500));

    const response = await model.generateContent(prompt);
    return response.response.text().trim();
  } catch (error) {
    console.error("Error generating summary:", error);
    return `${job.title} at ${job.company}. Apply for more details.`;
  }
}

async function extractTagsWithGemini(job: Job): Promise<string[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = TAGS_PROMPT.replace("{title}", job.title).replace(
      "{description}",
      job.description.substring(0, 500)
    );

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return ["Automation"];

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error extracting tags:", error);
    return ["Automation"];
  }
}

async function scrapeLinkedIn(): Promise<Job[]> {
  console.log("Starting LinkedIn scraping...");
  const browser = await chromium.launch({ headless: true });
  const jobs: Job[] = [];

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    for (const keyword of KEYWORDS.slice(0, 2)) {
      try {
        const url = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(keyword)}&location=`;
        await page.goto(url, { waitUntil: "domcontentloaded" });

        const jobListings = await page.$$eval(
          "a[data-job-id]",
          (elements) => {
            return elements.slice(0, 5).map((el) => ({
              title: el.textContent || "Unknown",
              link: el.href || "",
            }));
          }
        );

        for (const listing of jobListings) {
          try {
            const jobPage = await browser.newPage();
            await jobPage.goto(listing.link, { waitUntil: "domcontentloaded" });

            const jobData = await jobPage.evaluate(() => {
              const desc = document.body.innerText;
              const titleEl = document.querySelector("[data-test-job-title]");
              const companyEl = document.querySelector(
                "[data-test-job-company-name]"
              );
              const locationEl = document.querySelector(
                "[data-test-job-location]"
              );

              return {
                title: titleEl?.textContent || "Unknown",
                company: companyEl?.textContent || "Unknown",
                location: locationEl?.textContent || "Remote",
                description: desc.substring(0, 1000),
                url: window.location.href,
              };
            });

            jobs.push({
              title: jobData.title,
              company: jobData.company,
              location: jobData.location,
              salary_range: "Not specified",
              description: jobData.description,
              apply_url: jobData.url,
              source: "linkedin",
            });

            await jobPage.close();
          } catch (error) {
            console.error("Error scraping individual LinkedIn job:", error);
          }
        }
      } catch (error) {
        console.error(`Error scraping LinkedIn for keyword "${keyword}":`, error);
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }

  return jobs;
}

async function scrapeIndeed(): Promise<Job[]> {
  console.log("Starting Indeed scraping...");
  const browser = await chromium.launch({ headless: true });
  const jobs: Job[] = [];

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);

    for (const keyword of KEYWORDS.slice(0, 2)) {
      try {
        const url = `https://www.indeed.com/jobs?q=${encodeURIComponent(keyword)}`;
        await page.goto(url, { waitUntil: "domcontentloaded" });

        const jobListings = await page.$$eval(
          "div[data-jk]",
          (elements) => {
            return elements.slice(0, 5).map((el) => {
              const titleEl = el.querySelector("a[data-jk]");
              return {
                title: titleEl?.textContent || "Unknown",
                jobKey: el.getAttribute("data-jk") || "",
              };
            });
          }
        );

        for (const listing of jobListings) {
          try {
            const jobPage = await browser.newPage();
            const jobUrl = `https://www.indeed.com/jobs?jk=${listing.jobKey}`;
            await jobPage.goto(jobUrl, { waitUntil: "domcontentloaded" });

            const jobData = await jobPage.evaluate(() => {
              const title =
                document.querySelector("[data-testid=jobTitle]")?.textContent ||
                "Unknown";
              const company =
                document.querySelector("[data-testid=inlineHeader-companyName]")
                  ?.textContent || "Unknown";
              const location =
                document.querySelector("[data-testid=jobsearch-JobInfoHeader-location]")
                  ?.textContent || "Remote";
              const description = document.body.innerText.substring(0, 1000);

              return {
                title,
                company,
                location,
                description,
                url: window.location.href,
              };
            });

            jobs.push({
              title: jobData.title,
              company: jobData.company,
              location: jobData.location,
              salary_range: "Not specified",
              description: jobData.description,
              apply_url: jobData.url,
              source: "indeed",
            });

            await jobPage.close();
          } catch (error) {
            console.error("Error scraping individual Indeed job:", error);
          }
        }
      } catch (error) {
        console.error(`Error scraping Indeed for keyword "${keyword}":`, error);
      }
    }

    await page.close();
  } finally {
    await browser.close();
  }

  return jobs;
}

async function saveToSupabase(
  job: Job,
  summary: string,
  tags: string[]
): Promise<void> {
  try {
    const { error } = await supabase.from("jobs").insert({
      title: job.title,
      company: job.company,
      location: job.location,
      salary_range: job.salary_range,
      description: job.description,
      apply_url: job.apply_url,
      gemini_summary: summary,
      tags: tags,
      source: job.source,
      is_relevant: true,
    });

    if (error) {
      if (error.code === "23505") {
        console.log(
          `Job already exists: ${job.title} at ${job.company} (${job.apply_url})`
        );
      } else {
        console.error("Error saving job:", error);
      }
    } else {
      console.log(`Saved: ${job.title} at ${job.company}`);
    }
  } catch (error) {
    console.error("Error in saveToSupabase:", error);
  }
}

async function main() {
  console.log("🚀 Starting job scraper...");
  console.log(`✓ Supabase configured: ${supabaseUrl}`);
  console.log(`✓ Gemini API configured`);

  const allJobs: Job[] = [];

  try {
    const linkedinJobs = await scrapeLinkedIn();
    console.log(`Found ${linkedinJobs.length} jobs on LinkedIn`);
    allJobs.push(...linkedinJobs);

    const indeedJobs = await scrapeIndeed();
    console.log(`Found ${indeedJobs.length} jobs on Indeed`);
    allJobs.push(...indeedJobs);

    console.log(`\n📋 Processing ${allJobs.length} jobs...`);

    for (const job of allJobs) {
      console.log(`\nProcessing: ${job.title} at ${job.company}`);

      const { is_relevant, reason } = await validateJobWithGemini(job);
      console.log(`  Relevance: ${is_relevant ? "✓ YES" : "✗ NO"} (${reason})`);

      if (!is_relevant) continue;

      const summary = await generateSummaryWithGemini(job);
      console.log(`  Summary: ${summary.substring(0, 80)}...`);

      const tags = await extractTagsWithGemini(job);
      console.log(`  Tags: ${tags.join(", ")}`);

      await saveToSupabase(job, summary, tags);

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("\n✅ Scraping completed!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
