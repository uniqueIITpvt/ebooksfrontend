const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ui', 'media', 'MediaContentDesktop.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Remove the local Book interface to fix TS error 2440
content = content.replace(/interface Book \{[\s\S]*?\}\n\n/m, '');

// 2. Add Swiper imports if they don't exist
if (!content.includes('SwiperSlide')) {
  content = content.replace(/(import Link from 'next\/link';\n)/, "$1import { Swiper, SwiperSlide } from 'swiper/react';\nimport { Navigation, Pagination, Autoplay } from 'swiper/modules';\nimport 'swiper/css';\nimport 'swiper/css/navigation';\nimport 'swiper/css/pagination';\n");
}

// 3. Helper to replace grids with swiper
function replaceGridWithSwiper(content, listName) {
  // Finds the grid wrapper and replacing it with a Swiper wrapper
  // We need to match the specific map block structure.
  
  // Example Target:
  // <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8'>
  //   {isLoading...? ( ... ) : array.length === 0 ? ( ... ) : (
  //     array.slice(0, itemsPerPage).map((item, index) => (
  //       <div key={item.id} className='group relative w-full' ...>
  //         ...
  //       </div>
  //     ))
  //   )}
  // </div>

  // We will do string replacement for the map call and its wrapper.
  const mapStrOld = `${listName}.slice(0, itemsPerPage).map((`;
  const mapStrOldAlt = `get${listName.charAt(0).toUpperCase() + listName.slice(1)}PageItems().map((`; // For Books -> getBooksPageItems
  const mapStrNew = `${listName}.map((`;
  
  // We find the grid div and replace it with a relative div
  content = content.replace(/<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8'>/g, "<div className='relative books-swiper mb-8 group/swiper'>");
  
  // We replace the skeleton and no-data parts internally so they still use normal div / grid (optional but it's okay to just leave it wrapped in relative)
  // Wait, if we change the outer div to relative, the skeleton needs its own grid!
  
  return content;
}

// It is actually easier to just do regex replace for the entire section
let finalContent = content;

const sections = [
  { isLoading: 'isLoadingBooks', array: 'books', name: 'book', getter: 'getBooksPageItems()' },
  { isLoading: 'isLoadingFreeSummaries', array: 'freeSummaries', name: 'summary', getter: 'freeSummaries.slice(0, itemsPerPage)' },
  { isLoading: 'isLoadingTrendingBooks', array: 'trendingBooks', name: 'book', getter: 'trendingBooks.slice(0, itemsPerPage)' },
  { isLoading: 'isLoadingPremiumSummaries', array: 'premiumSummaries', name: 'summary', getter: 'premiumSummaries.slice(0, itemsPerPage)' }
];

sections.forEach(sec => {
  // Replace the grid container start
  const regexArrayMap = new RegExp(`${sec.getter.replace(/\\/g, '\\\\').replace(/\\(/g, '\\(').replace(/\\)/g, '\\)')}\\.map\\(\\(${sec.name}, index\\) => \\(`, 'g');
  
  finalContent = finalContent.replace(regexArrayMap, `
              <div className='relative books-swiper'>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={24}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 5 },
                  }}
                  navigation={{
                    nextEl: '.${sec.array}-next',
                    prevEl: '.${sec.array}-prev',
                  }}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  className='!pb-12 px-2'
                >
                  {${sec.array}.map((${sec.name}, index) => (
                    <SwiperSlide key={${sec.name}.id || ${sec.name}._id}>
  `);

  // Try to find the end of the map:
  // Since each section has exactly one `      ))
  //           )}
  //         </div>`
  // We can replace just that specifically for each section by tracking position or just string replace.
  // Actually, replacing `)) : (` -> `)) } </Swiper> ...` is hard without AST.

});

// Let's use a more targeted replacement: Replace the 4 occurrences of the map body wrappers.
// We can just use split and join.

const parts = finalContent.split("<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8'>");

if (parts.length === 5) {
  // We have exactly 4 sections
  for (let i = 1; i <= 4; i++) {
    const sec = sections[i-1];
    let part = parts[i];
    
    // 1. Give skeleton a grid so it displays correctly
    part = part.replace(
      `{${sec.isLoading} ? (`, 
      `          {${sec.isLoading} ? (\n            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8 w-full'>`
    );
    part = part.replace(
      `))
            ) : ${sec.array}.length === 0 ? (`,
      `))
            </div>
            ) : ${sec.array}.length === 0 ? (`
    );

    // 2. Wrap the .map with Swiper
    part = part.replace(
      `${sec.getter}.map((${sec.name}, index) => (`,
      `<div className='relative books-swiper group/swiper'>
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={24}
                  slidesPerView={1}
                  breakpoints={{
                    640: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 },
                    1280: { slidesPerView: 5 },
                  }}
                  navigation={{
                    nextEl: '.${sec.array}-next',
                    prevEl: '.${sec.array}-prev',
                  }}
                  pagination={{ clickable: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: false }}
                  className='!pb-12 px-2'
                >
                  {${sec.array}.map((${sec.name}, index) => (
                    <SwiperSlide key={${sec.name}.id || ${sec.name}._id || index}>`
    );

    // 3. Find the end of the group relative w-full div and close SwiperSlide
    // We can replace the closing div that has a line containing `))
    //        )}`
    
    part = part.replace(
      /                  <\/div>\n                <\/div>\n              \)\)\n            \)}/,
      `                  </div>
                </div>
              </SwiperSlide>
            ))}
            </Swiper>
            {${sec.array}.length > 5 && (
              <>
                <button className='${sec.array}-prev absolute -left-4 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white/95 rounded-full shadow-lg border border-indigo-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 opacity-0 group-hover/swiper:opacity-100 transition-all hover:scale-110'>
                  <ChevronLeftIcon className='w-6 h-6' />
                </button>
                <button className='${sec.array}-next absolute -right-4 top-[40%] -translate-y-1/2 z-10 w-12 h-12 bg-white/95 rounded-full shadow-lg border border-indigo-100 flex items-center justify-center text-slate-600 hover:text-indigo-600 opacity-0 group-hover/swiper:opacity-100 transition-all hover:scale-110'>
                  <ChevronRightIcon className='w-6 h-6' />
                </button>
              </>
            )}
            </div>
          )}`
    );

    parts[i] = `<div className='relative mb-8'>` + part;
  }
}

finalContent = parts.join('');

// Also need to add ChevronLeftIcon to heroicons import
if (!finalContent.includes('ChevronLeftIcon')) {
  finalContent = finalContent.replace("ChevronRightIcon,\n}", "ChevronRightIcon,\n  ChevronLeftIcon,\n}");
}

fs.writeFileSync(filePath, finalContent, 'utf-8');
console.log('Successfully refactored MediaContentDesktop.tsx');
