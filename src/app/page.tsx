import type { Metadata } from "next";
import MediaContent from "@/components/ui/media/MediaContent";
import About from "@/components/ui/sections/About";
import CTA from "@/components/ui/sections/CTA";
import Hero from "@/components/ui/sections/Hero";
import { getHomePageData } from "@/lib/server/public-data";
import { SITE_DESCRIPTION, SITE_KEYWORDS, siteUrl } from "@/config/site.config";
// import ChatbotFeatures from "@/components/ui/sections/ChatbotFeatures";

export const metadata: Metadata = {
  title: "Ebooks, Audiobooks & Book Summaries",
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: siteUrl("/"),
  },
  openGraph: {
    title: "TechUniqueIIT Ebook Store",
    description: SITE_DESCRIPTION,
    url: siteUrl("/"),
    type: "website",
  },
};

export default async function Home() {
  const homeData = await getHomePageData();

  return (
    <div className='min-h-screen'>
      <h1 className='sr-only'>
        TechUniqueIIT Ebook Store for ebooks, audiobooks and book summaries
      </h1>
      <div id='hero'>
        <Hero banners={homeData.banners} bannerEnabled={homeData.bannerEnabled} />
      </div>

      <div id='media-content'>
        <MediaContent
          newReleaseBooks={homeData.newReleaseBooks}
          newReleaseAudiobooks={homeData.newReleaseAudiobooks}
          freeSummaries={homeData.freeSummaries}
          trendingBooks={homeData.trendingBooks}
          premiumSummaries={homeData.premiumSummaries}
          categories={homeData.categories}
        />
      </div>

      {/* <div id='chatbot-features'>
        <ChatbotFeatures />
      </div> */}
      <div id='about'>
        <About />
      </div>
      <div id='cta'>
        <CTA />
      </div>
      {/* <SectionToggle /> */}
    </div>
  );
}
