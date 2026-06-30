import { booksApi, type Book } from '@/services/api/booksApi';
import { categoriesApi, type Category } from '@/services/api/categoriesApi';
import { bookTypesApi } from '@/services/api/bookTypesApi';
import { bookFormatsApi } from '@/services/api/bookFormatsApi';
import { bookHubsApi } from '@/services/api/bookHubsApi';
import { bookStatusesApi } from '@/services/api/bookStatusesApi';
import { gstApi } from '@/services/api/gstApi';
import { languageApi } from '@/services/api/languageApi';
import { defaultCategories } from '../constants';

type BookDataHandlersContext = Record<string, any>;

export function createBookDataHandlers(ctx: BookDataHandlersContext) {
  const {
    books,
    searchQuery,
    filterCategory,
    filterStatus,
    filterType,
    setLoading,
    setCategories,
    setBookTypes,
    setBookFormats,
    setBookHubs,
    setBookStatusesList,
    setGstList,
    setLanguageList,
    setBooks,
    setFilteredBooks,
    setApiAvailable,
    setStats,
    showErrorAlert,
  } = ctx;
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Try to load categories first
      try {
        const categoriesResponse = await categoriesApi.getActive();
        if (
          categoriesResponse.success &&
          categoriesResponse.data &&
          categoriesResponse.data.length > 0
        ) {
          setCategories(categoriesResponse.data);
        } else {
          // Use default categories if API returns empty
          const fallbackCategories = defaultCategories.map(
            (name, index) =>
              ({
                _id: `fallback-${index}`,
                id: `fallback-${index}`,
                name,
                slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                color: "#1976d2",
                icon: "book",
                isActive: true,
                sortOrder: index,
                bookCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }) as Category,
          );
          setCategories(fallbackCategories);
        }
      } catch (error) {
        console.warn("Categories API not available, using default categories");
        // Fallback to default categories
        const fallbackCategories = defaultCategories.map(
          (name, index) =>
            ({
              _id: `fallback-${index}`,
              id: `fallback-${index}`,
              name,
              slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              color: "#1976d2",
              icon: "book",
              isActive: true,
              sortOrder: index,
              bookCount: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }) as Category,
        );
        setCategories(fallbackCategories);
      }

      // Try to load book types
      try {
        const bookTypesResponse = await bookTypesApi.getActive();
        if (
          bookTypesResponse.success &&
          bookTypesResponse.data &&
          bookTypesResponse.data.length > 0
        ) {
          setBookTypes(bookTypesResponse.data);
        }
      } catch (error) {
        console.warn("Book Types API not available, using default types");
      }

      // Try to load book formats
      try {
        const bookFormatsResponse = await bookFormatsApi.getActive();
        if (
          bookFormatsResponse.success &&
          bookFormatsResponse.data &&
          bookFormatsResponse.data.length > 0
        ) {
          setBookFormats(bookFormatsResponse.data);
        }
      } catch (error) {
        console.warn("Book Formats API not available");
      }

      // Try to load book hubs (component types)
      try {
        const bookHubsResponse = await bookHubsApi.getActive();
        if (
          bookHubsResponse.success &&
          bookHubsResponse.data &&
          bookHubsResponse.data.length > 0
        ) {
          setBookHubs(bookHubsResponse.data);
        }
      } catch (error) {
        console.warn("Book Hubs API not available, using default hubs");
      }

      // Try to load book statuses
      try {
        const bookStatusesResponse = await bookStatusesApi.getActive();
        if (
          bookStatusesResponse.success &&
          bookStatusesResponse.data &&
          bookStatusesResponse.data.length > 0
        ) {
          setBookStatusesList(bookStatusesResponse.data);
        }
      } catch (error) {
        console.warn("Book Statuses API not available, using default statuses");
      }

      // Try to load GST list
      try {
        const gstResponse = await gstApi.getAll();
        if (gstResponse.success && gstResponse.data) {
          setGstList(gstResponse.data);
        }
      } catch (error) {
        console.warn("GST API not available");
      }

      // Try to load Languages
      try {
        const languageResponse = await languageApi.getAllLanguages();
        if (languageResponse.success && languageResponse.data) {
          setLanguageList(languageResponse.data);
        }
      } catch (error) {
        console.warn("Language API not available");
      }

      // Try to load books
      let booksData: Book[] = [];
      try {
        const booksResponse = await booksApi.getAllBooks({ adminView: true });
        booksData = booksResponse.data;
        setBooks(booksData);
        setFilteredBooks(booksData);
      } catch (error) {
        console.warn("Books API not available, using fallback data");
        setApiAvailable(false);
        booksData = [];
        setBooks(booksData);
        setFilteredBooks(booksData);
      }

      try {
        const statsResponse = await booksApi.getStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
      } catch (error) {
        console.warn("Stats API not available, calculating from books data");
        // Calculate stats from books data
        const calculatedStats = {
          total: booksData.length,
          published: booksData.filter((b) => b.status === "published").length,
          featured: booksData.filter((b) => b.featured).length,
          bestsellers: booksData.filter((b) => b.bestseller).length,
          totalSales: booksData.reduce(
            (sum, book) => sum + (book.sales || 0),
            0,
          ),
        };
        setStats(calculatedStats);
      }
    } catch (error: any) {
      console.error("Error loading initial data:", error);
      showErrorAlert(
        "Failed to load data",
        "Some features may not be available. Please check your connection and try again.",
      );
      setApiAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchBooks = async () => {
    try {
      const params: any = {};
      params.limit = 200;
      params.adminView = true;
      if (searchQuery) params.search = searchQuery;
      if (filterCategory) params.category = filterCategory;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;

      const response = await booksApi.getAllBooks(params);
      if (response.success) {
        setFilteredBooks(response.data);
      }
    } catch (error) {
      console.warn("Error fetching books, using local filtering:", error);
      // Fallback to local filtering if API is not available
      let filtered = books;

      if (searchQuery) {
        filtered = filtered.filter(
          (book: any) =>
            book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
            book.category.toLowerCase().includes(searchQuery.toLowerCase()),
        );
      }

      if (filterCategory) {
        filtered = filtered.filter((book: any) => book.category === filterCategory);
      }

      if (filterStatus) {
        filtered = filtered.filter((book: any) => book.status === filterStatus);
      }

      if (filterType) {
        filtered = filtered.filter((book: any) => (book as any).type === filterType);
      }

      setFilteredBooks(filtered);
    }
  };
  return { loadInitialData, fetchBooks };
}