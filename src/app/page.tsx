import type { Metadata } from "next";
import MediaContent from "@/components/ui/media/MediaContent";
import Hero from "@/components/ui/sections/Hero";
// import Testimonials from "@/components/ui/sections/Testimonials";
import { getHomePageData } from "@/lib/server/public-data";
// import { getPublishedTestimonials } from "@/services/api/testimonialsApi";
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
    title: "Unique Books Plus Ebook Store",
    description: SITE_DESCRIPTION,
    url: siteUrl("/"),
    type: "website",
  },
};

export default async function Home() {
  const homeData = await getHomePageData();
  // const [homeData, testimonialsData] = await Promise.all([
  //   getHomePageData(),
  //   getPublishedTestimonials(),
  // ]);

  return (
    <div className='min-h-screen'>
      <h1 className='sr-only'>
        Unique Books Plus Ebook Store for ebooks, audiobooks and book summaries
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

      {/* <div id='testimonials'>
        <Testimonials
          testimonials={testimonialsData.testimonials}
          stats={testimonialsData.stats}
        />
      </div> */}

      {/* <div id='chatbot-features'>
        <ChatbotFeatures />
      </div> */}
      {/* <SectionToggle /> */}
    </div>
  );
}
