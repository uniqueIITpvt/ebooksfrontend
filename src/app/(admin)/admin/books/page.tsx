"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import {
  booksApi,
  type Book,
  type BookPayload,
  type BookFile,
} from "@/services/api/booksApi";
import { categoriesApi, type Category } from "@/services/api/categoriesApi";
import { bookTypesApi, type BookType } from "@/services/api/bookTypesApi";
import { bookFormatsApi, type BookFormat } from "@/services/api/bookFormatsApi";
import { bookHubsApi, type BookHub } from "@/services/api/bookHubsApi";
import {
  bookStatusesApi,
  type BookStatus,
} from "@/services/api/bookStatusesApi";
import { gstApi, type GstRecord } from "@/services/api/gstApi";
import { languageApi, type LanguageRecord } from "@/services/api/languageApi";
import AdminBooksTable from "./parts/AdminBooksTable";
import BooksActionMenu from "./parts/BooksActionMenu";
import BooksDialogs from "./parts/BooksDialogs";
import BooksTopControls from "./parts/BooksTopControls";
import { statuses } from "./constants";
import { getInlineAssetUrl, getNumericBookValue } from "./formatters";
import { createBookDataHandlers } from "./logic/bookDataHandlers";
import { createHandleSaveBook } from "./logic/bookSaveHandler";
import type {
  BookFormData,
  ConfirmDialog,
  UploadTarget,
  ValidationErrors,
} from "./types";

export default function BooksPage() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bookTypes, setBookTypes] = useState<BookType[]>([]);
  const [bookFormats, setBookFormats] = useState<BookFormat[]>([]);
  const [bookHubs, setBookHubs] = useState<BookHub[]>([]);
  const [bookStatusesList, setBookStatusesList] = useState<BookStatus[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [bookTypeDialogOpen, setBookTypeDialogOpen] = useState(false);
  const [bookFormatDialogOpen, setBookFormatDialogOpen] = useState(false);
  const [bookHubDialogOpen, setBookHubDialogOpen] = useState(false);
  const [bookStatusDialogOpen, setBookStatusDialogOpen] = useState(false);
  const [gstDialogOpen, setGstDialogOpen] = useState(false);
  const [gstList, setGstList] = useState<GstRecord[]>([]);
  const [newGstData, setNewGstData] = useState({ percentage: 0 });
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);
  const [languageList, setLanguageList] = useState<LanguageRecord[]>([]);
  const [newLanguageData, setNewLanguageData] = useState({ name: "" });
  const [newCategoryData, setNewCategoryData] = useState({
    name: "",
    description: "",
    color: "#1976d2",
  });
  const [newBookTypeData, setNewBookTypeData] = useState({
    name: "",
    description: "",
    color: "#1976d2",
  });
  const [newBookFormatData, setNewBookFormatData] = useState({
    name: "",
    description: "",
  });
  const [newBookHubData, setNewBookHubData] = useState({
    name: "",
    value: "",
    description: "",
    color: "#9c27b0",
  });
  const [newBookStatusData, setNewBookStatusData] = useState({
    name: "",
    value: "",
    description: "",
    color: "#757575",
  });
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    featured: 0,
    bestsellers: 0,
    totalSales: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [tablePage, setTablePage] = useState(1);
  const [selectedBook, setSelectedBook] =
    useState<Partial<BookFormData> | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "view">("add");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuBookId, setMenuBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [apiAvailable, setApiAvailable] = useState(true);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [bookFilePreview, setBookFilePreview] = useState<string | null>(null);
  const [audioFilePreview, setAudioFilePreview] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<UploadTarget | null>(
    null,
  );
  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const ebookInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const isReadOnlyMode = dialogMode === "view";
  const rowsPerPage = 20;
  const totalTablePages = Math.max(
    1,
    Math.ceil(filteredBooks.length / rowsPerPage),
  );
  const paginatedBooks = filteredBooks.slice(
    (tablePage - 1) * rowsPerPage,
    tablePage * rowsPerPage,
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Filter books based on search and filters
  useEffect(() => {
    fetchBooks();
  }, [searchQuery, filterCategory, filterStatus, filterType]);

  useEffect(() => {
    setTablePage(1);
  }, [searchQuery, filterCategory, filterStatus, filterType]);

  useEffect(() => {
    if (tablePage > totalTablePages) {
      setTablePage(totalTablePages);
    }
  }, [tablePage, totalTablePages]);

  useEffect(() => {
    const typeParam = searchParams?.get("type");
    if (typeParam === "Audiobook" || typeParam === "Books") {
      setFilterType(typeParam);
    }
  }, [searchParams]);





  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    bookId: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setMenuBookId(bookId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuBookId(null);
  };

  // Validation functions
  const validateBook = (book: Partial<BookFormData>): ValidationErrors => {
    const errors: ValidationErrors = {};

    // Title validation
    if (!book.title?.trim()) {
      errors.title = "Title is required";
    } else if (book.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters long";
    } else if (book.title.trim().length > 200) {
      errors.title = "Title must be less than 200 characters";
    }

    // Author validation
    if (!book.author?.trim()) {
      errors.author = "Author is required";
    } else if (book.author.trim().length < 2) {
      errors.author = "Author name must be at least 2 characters long";
    }

    // Category validation
    if (!book.category?.trim()) {
      errors.category = "Category is required";
    }

    // Description validation
    if (!book.description?.trim()) {
      errors.description = "Description is required";
    } else if (book.description.trim().length < 10) {
      errors.description = "Description must be at least 10 characters long";
    } else if (book.description.trim().length > 2000) {
      errors.description = "Description must be less than 2000 characters";
    }

    // Price validation
    if (book.discountPrice === undefined || book.discountPrice === null) {
      errors.discountPrice = "Price is required";
    } else {
      const priceValue =
        typeof book.discountPrice === "string"
          ? parseFloat(book.discountPrice)
          : book.discountPrice;
      if (isNaN(priceValue)) {
        errors.discountPrice = "Price must be a valid number";
      } else if (priceValue < 0) {
        errors.discountPrice = "Price cannot be negative";
      } else if (priceValue > 10000) {
        errors.discountPrice = "Price seems too high (max ₹10,000)";
      }
    }

    // Pages validation
    if (book.pages !== undefined && book.pages !== null) {
      const pagesValue =
        typeof book.pages === "string" ? parseInt(book.pages) : book.pages;
      if (isNaN(pagesValue)) {
        errors.pages = "Pages must be a valid number";
      } else if (pagesValue < 1) {
        errors.pages = "Pages must be at least 1";
      } else if (pagesValue > 10000) {
        errors.pages = "Pages seems too high (max 10,000)";
      }
    }

    // ISBN validation (basic format check)
    if (book.isbn && book.isbn.trim()) {
      const isbnRegex =
        /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
      if (!isbnRegex.test(book.isbn.replace(/[- ]/g, ""))) {
        errors.isbn = "Please enter a valid ISBN format";
      }
    }

    // Format validation
    const validFormatNames =
      bookFormats.length > 0
        ? bookFormats.map((f) => f.name).concat(["Audiobook"])
        : ["Hardcover", "Paperback", "E-book", "Audiobook"];
    if (
      !book.format ||
      !Array.isArray(book.format) ||
      book.format.length === 0
    ) {
      errors.format = "At least one format is required";
    } else {
      const invalidFormats = book.format.filter(
        (format) => !validFormatNames.includes(format),
      );
      if (invalidFormats.length > 0) {
        errors.format = `Invalid format(s): ${invalidFormats.join(", ")}. Valid formats are: ${validFormatNames.join(", ")}`;
      }
    }

    // Publish Date validation
    if (!book.publishDate) {
      errors.publishDate = "Publish date is required";
    } else {
      const publishDate = new Date(book.publishDate);
      const today = new Date();
      if (publishDate > today) {
        errors.publishDate = "Publish date cannot be in the future";
      }
    }

    // Rating validation
    if (book.rating !== undefined && book.rating !== null) {
      if (book.rating < 0 || book.rating > 5) {
        errors.rating = "Rating must be between 0 and 5";
      }
    }

    // Reviews validation
    if (book.reviews !== undefined && book.reviews !== null) {
      if (book.reviews < 0) {
        errors.reviews = "Reviews count cannot be negative";
      }
    }

    // Sales validation
    if (book.sales !== undefined && book.sales !== null) {
      if (book.sales < 0) {
        errors.sales = "Sales count cannot be negative";
      }
    }

    return errors;
  };

  const showErrorAlert = (message: string, details?: string) => {
    setSnackbar({
      open: true,
      message: details ? `${message}: ${details}` : message,
      severity: "error",
    });
  };

  const showSuccessAlert = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "success",
    });
  };

  const showWarningAlert = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: "warning",
    });
  };

  const { loadInitialData, fetchBooks } = createBookDataHandlers({
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
  });
  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "success";
      case "draft":
        return "default";
      case "review":
        return "warning";
      case "archived":
        return "secondary";
      default:
        return "default";
    }
  };

  // Image handling functions
  const getUploadInput = (target: UploadTarget) => {
    switch (target) {
      case "cover":
        return coverInputRef.current;
      case "ebook":
        return ebookInputRef.current;
      case "audio":
        return audioInputRef.current;
      default:
        return null;
    }
  };

  const openUploadPicker = (target: UploadTarget) => {
    if (isReadOnlyMode) return;
    getUploadInput(target)?.click();
  };

  const getUploadZoneStateSx = (
    target: UploadTarget,
    defaultBackground: string = "grey.50",
  ) => ({
    border:
      dragOverTarget === target ? "2px dashed #1976d2" : "2px dashed #ddd",
    bgcolor:
      dragOverTarget === target
        ? "rgba(25, 118, 210, 0.04)"
        : defaultBackground,
    cursor: isReadOnlyMode ? "default" : "pointer",
    transition: "all 0.3s",
    "&:hover": isReadOnlyMode
      ? undefined
      : {
          borderColor: "#1976d2",
          bgcolor: "rgba(25, 118, 210, 0.04)",
        },
  });

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showErrorAlert("Invalid file type", "Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showErrorAlert(
        "File too large",
        "Please select an image smaller than 5MB",
      );
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setImagePreview(previewUrl);
      setSelectedBook((prev) =>
        prev
          ? {
              ...prev,
              coverImage: previewUrl,
              image: previewUrl,
            }
          : prev,
      );
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      processImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedBook((prev) =>
      prev
        ? {
            ...prev,
            coverImage: "",
            image: "",
          }
        : prev,
    );
  };

  // Book file handling functions
  const processBookFile = (file: File) => {
    const allowedTypes = [
      "application/pdf",
      "application/epub+zip",
      "text/plain",
    ];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.toLowerCase().endsWith(".epub")
    ) {
      showErrorAlert(
        "Invalid file type",
        "Please select a PDF, EPUB, or TXT file",
      );
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showErrorAlert(
        "File too large",
        "Please select a book file smaller than 50MB",
      );
      return;
    }

    setBookFile(file);
    setBookFilePreview(file.name);
  };

  const handleBookFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      processBookFile(file);
    }
  };

  const handleRemoveBookFile = () => {
    setBookFile(null);
    setBookFilePreview(null);
  };

  // Audio file handling functions
  const processAudioFile = (file: File) => {
    const allowedTypes = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"];
    if (
      !allowedTypes.includes(file.type) &&
      !file.name.toLowerCase().match(/\.(mp3|m4a|wav|ogg)$/)
    ) {
      showErrorAlert(
        "Invalid file type",
        "Please select an MP3, M4A, WAV, or OGG audio file",
      );
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      showErrorAlert(
        "File too large",
        "Please select an audio file smaller than 500MB",
      );
      return;
    }

    setAudioFile(file);
    setAudioFilePreview(file.name);
  };

  const handleAudioFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) {
      processAudioFile(file);
    }
  };

  const handleRemoveAudioFile = () => {
    setAudioFile(null);
    setAudioFilePreview(null);
  };

  const handleUploadZoneDragEnter =
    (target: UploadTarget) => (event: React.DragEvent<HTMLElement>) => {
      if (isReadOnlyMode) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOverTarget(target);
    };

  const handleUploadZoneDragOver =
    (target: UploadTarget) => (event: React.DragEvent<HTMLElement>) => {
      if (isReadOnlyMode) return;
      event.preventDefault();
      event.stopPropagation();
      if (dragOverTarget !== target) {
        setDragOverTarget(target);
      }
    };

  const handleUploadZoneDragLeave =
    (target: UploadTarget) => (event: React.DragEvent<HTMLElement>) => {
      if (isReadOnlyMode) return;
      event.preventDefault();
      event.stopPropagation();
      const relatedTarget = event.relatedTarget;
      if (
        relatedTarget instanceof Node &&
        event.currentTarget.contains(relatedTarget)
      ) {
        return;
      }
      setDragOverTarget((current) => (current === target ? null : current));
    };

  const handleUploadZoneDrop =
    (target: UploadTarget) => (event: React.DragEvent<HTMLElement>) => {
      if (isReadOnlyMode) return;
      event.preventDefault();
      event.stopPropagation();
      setDragOverTarget(null);

      const file = event.dataTransfer.files?.[0];
      if (!file) return;

      switch (target) {
        case "cover":
          processImageFile(file);
          break;
        case "ebook":
          processBookFile(file);
          break;
        case "audio":
          processAudioFile(file);
          break;
        default:
          break;
      }
    };

  const handleUploadZoneKeyDown =
    (target: UploadTarget) => (event: React.KeyboardEvent<HTMLElement>) => {
      if (isReadOnlyMode) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openUploadPicker(target);
    };

  const handleDialogOpen = (mode: "add" | "edit" | "view", book?: Book) => {
    setDialogMode(mode);
    setValidationErrors({}); // Clear previous validation errors

    if (book) {
      // Convert API Book to form data
      const formData: Partial<BookFormData> = {
        ...book,
        _id: (book as any)._id || book.id,
        discountPrice:
          typeof book.price === "string"
            ? parseFloat(book.price.replace(/[^0-9.]/g, "")) || 0
            : book.price,
        originalPrice: book.originalPrice
          ? typeof book.originalPrice === "string"
            ? parseFloat(book.originalPrice.replace(/[^0-9.]/g, ""))
            : book.originalPrice
          : undefined,
        sales: getNumericBookValue(
          (book as any).sales ??
            (book as any).salesCount ??
            (book as any).totalSales,
        ),
        coverImage: book.image || (book as any).coverImage,
        // Format publishDate for HTML date input (YYYY-MM-DD)
        publishDate: book.publishDate
          ? new Date(book.publishDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };

      setSelectedBook(formData);
      setImagePreview(
        getInlineAssetUrl(book.image || (book as any).coverImage) || null,
      );

      // Clear any uploaded files to show existing file previews
      setBookFile(null);
      setAudioFile(null);
      setBookFilePreview(null);
      setAudioFilePreview(null);
    } else {
      setSelectedBook({
        title: "",
        author: "UniqueIIT Research Center",
        category: "",
        status: "draft",
        featured: false,
        bestseller: false,
        discountPrice: 0,
        description: "",
        pages: 0,
        format: ["E-book"], // Default format to prevent validation errors
        isbn: "",
        publishDate: new Date().toISOString().split("T")[0],
        coverImage: "",
        rating: 0,
        reviews: 0,
        sales: 0,
        // New fields
        subtitle: "",
        tags: [],
        originalPrice: undefined,
        duration: "",
        narrator: "",
      });
      setImagePreview(null);
    }

    setImageFile(null);
    setBookFile(null);
    setAudioFile(null);
    setBookFilePreview(null);
    setAudioFilePreview(null);
    setDragOverTarget(null);
    setDialogOpen(true);
    handleMenuClose();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBook(null);
    setValidationErrors({});
    setImagePreview(null);

    // Clean up file URLs to prevent memory leaks
    if (imageFile) {
      URL.revokeObjectURL(imageFile as any);
    }
    if (bookFile) {
      URL.revokeObjectURL(bookFile as any);
    }
    if (audioFile) {
      URL.revokeObjectURL(audioFile as any);
    }

    setImageFile(null);
    setBookFile(null);
    setAudioFile(null);
    setBookFilePreview(null);
    setAudioFilePreview(null);
    setDragOverTarget(null);
  };

  const handleConfirmDialogClose = () => {
    setConfirmDialog({
      open: false,
      title: "",
      message: "",
      onConfirm: () => {},
    });
  };

  const handleSaveBook = createHandleSaveBook({
    selectedBook,
    audioFile,
    imageFile,
    bookFile,
    dialogMode,
    books,
    validateBook,
    setValidationErrors,
    setSubmitting,
    showErrorAlert,
    showSuccessAlert,
    showWarningAlert,
    loadInitialData,
    handleDialogClose,
    setBooks,
  });

  const handleDeleteBook = (bookId: string) => {
    const book = books.find(
      (b) => (b as any)._id === bookId || b.id === bookId,
    );
    if (!book) return;

    setConfirmDialog({
      open: true,
      title: "Delete Book",
      message: `Are you sure you want to delete "${book.title}"? This action cannot be undone.`,
      onConfirm: () => confirmDeleteBook(bookId),
    });
    handleMenuClose();
  };

  const confirmDeleteBook = async (bookId: string) => {
    try {
      try {
        const response = await booksApi.deleteBook(bookId);
        if (response.success) {
          showSuccessAlert("Book deleted successfully!");
          await loadInitialData(); // Refresh data
        } else {
          showErrorAlert("Failed to delete book", "Server returned an error");
        }
      } catch (error: any) {
        console.warn("API not available, deleting book locally");
        // Fallback: delete book locally
        const updatedBooks = books.filter(
          (book) => (book as any)._id !== bookId && book.id !== bookId,
        );
        setBooks(updatedBooks);
        showWarningAlert("Book deleted locally (API not available)");
      }
    } catch (error: any) {
      console.error("Error deleting book:", error);
      showErrorAlert(
        "Failed to delete book",
        error.message || "Please try again",
      );
    }
    handleConfirmDialogClose();
  };

  const toggleFeatured = async (bookId: string) => {
    try {
      const book = books.find(
        (b) => (b as any)._id === bookId || b.id === bookId,
      );
      if (!book) return;

      try {
        const response = await booksApi.updateBook(bookId, {
          featured: !book.featured,
        });
        if (response.success) {
          setSnackbar({
            open: true,
            message: `Book ${!book.featured ? "featured" : "unfeatured"} successfully!`,
            severity: "success",
          });
          await loadInitialData(); // Refresh data
        }
      } catch (error) {
        console.warn("API not available, updating book locally");
        // Fallback: update book locally
        const updatedBooks = books.map((b) =>
          (b as any)._id === bookId || b.id === bookId
            ? {
                ...b,
                featured: !b.featured,
                updatedAt: new Date().toISOString(),
              }
            : b,
        );
        setBooks(updatedBooks);
        setSnackbar({
          open: true,
          message: `Book ${!book.featured ? "featured" : "unfeatured"} locally (API not available)`,
          severity: "warning",
        });
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
      setSnackbar({
        open: true,
        message: "Failed to update book status. Please try again.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleArchiveBook = async (bookId: string) => {
    try {
      const book = books.find(
        (b) => (b as any)._id === bookId || b.id === bookId,
      );
      if (!book) return;

      const isCurrentlyArchived = book.status === "archived";
      const newStatus = isCurrentlyArchived ? "published" : "archived";
      const actionText = isCurrentlyArchived ? "unarchived" : "archived";

      try {
        const response = await booksApi.updateBook(bookId, {
          status: newStatus,
        });
        if (response.success) {
          setSnackbar({
            open: true,
            message: `Book ${actionText} successfully!`,
            severity: "success",
          });
          await loadInitialData(); // Refresh data
        }
      } catch (error) {
        console.warn("API not available, updating book locally");
        // Fallback: update book locally
        const updatedBooks = books.map((b) =>
          (b as any)._id === bookId || b.id === bookId
            ? {
                ...b,
                status: newStatus as
                  | "draft"
                  | "review"
                  | "published"
                  | "archived",
                updatedAt: new Date().toISOString(),
              }
            : b,
        );
        setBooks(updatedBooks);
        setSnackbar({
          open: true,
          message: `Book ${actionText} locally (API not available)`,
          severity: "warning",
        });
      }
    } catch (error) {
      console.error("Error archiving book:", error);
      setSnackbar({
        open: true,
        message: "Failed to archive book. Please try again.",
        severity: "error",
      });
    }
    handleMenuClose();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryData.name.trim()) {
      showErrorAlert("Category name is required");
      return;
    }

    try {
      const response = await categoriesApi.create({
        name: newCategoryData.name.trim(),
        description: newCategoryData.description.trim() || undefined,
        color: newCategoryData.color,
      });

      if (response.success) {
        // Add new category to list
        setCategories([...categories, response.data]);
        // Auto-select the new category
        setSelectedBook({
          ...selectedBook,
          category: response.data.name,
        });
        // Reset form and close dialog
        setNewCategoryData({ name: "", description: "", color: "#1976d2" });
        setCategoryDialogOpen(false);
        showSuccessAlert(
          `Category "${response.data.name}" created successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating category:", error);
      showErrorAlert(
        "Failed to create category",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new book type
  const handleCreateBookType = async () => {
    if (!newBookTypeData.name.trim()) {
      showErrorAlert("Book type name is required");
      return;
    }

    try {
      const response = await bookTypesApi.create({
        name: newBookTypeData.name.trim(),
        description: newBookTypeData.description.trim() || undefined,
        color: newBookTypeData.color,
      });

      if (response.success) {
        setBookTypes([...bookTypes, response.data]);
        setSelectedBook({ ...selectedBook, type: response.data.name as any });
        setNewBookTypeData({ name: "", description: "", color: "#1976d2" });
        setBookTypeDialogOpen(false);
        showSuccessAlert(
          `Book Type "${response.data.name}" created successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating book type:", error);
      showErrorAlert(
        "Failed to create book type",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new book format
  const handleCreateBookFormat = async () => {
    if (!newBookFormatData.name.trim()) {
      showErrorAlert("Format name is required");
      return;
    }
    try {
      const response = await bookFormatsApi.create({
        name: newBookFormatData.name.trim(),
        description: newBookFormatData.description.trim() || undefined,
      });
      if (response.success) {
        const updated = [...bookFormats, response.data];
        setBookFormats(updated);
        // Auto-select the newly created format
        const currentFormat = (selectedBook?.format || []).filter(
          (f: string) => f !== "Audiobook",
        );
        setSelectedBook({
          ...selectedBook,
          format: [...currentFormat, response.data.name],
        });
        setNewBookFormatData({ name: "", description: "" });
        setBookFormatDialogOpen(false);
        showSuccessAlert(
          `Format "${response.data.name}" created successfully!`,
        );
      }
    } catch (error: any) {
      showErrorAlert(
        "Failed to create book format",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new book hub
  const handleCreateBookHub = async () => {
    if (!newBookHubData.name.trim() || !newBookHubData.value.trim()) {
      showErrorAlert("Book hub name and value are required");
      return;
    }

    try {
      const response = await bookHubsApi.create({
        name: newBookHubData.name.trim(),
        value: newBookHubData.value.trim(),
        description: newBookHubData.description.trim() || undefined,
        color: newBookHubData.color,
      });

      if (response.success) {
        setBookHubs([...bookHubs, response.data]);
        setSelectedBook({
          ...selectedBook,
          componentType: response.data.value as any,
        });
        setNewBookHubData({
          name: "",
          value: "",
          description: "",
          color: "#9c27b0",
        });
        setBookHubDialogOpen(false);
        showSuccessAlert(
          `Books Hub "${response.data.name}" created successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating book hub:", error);
      showErrorAlert(
        "Failed to create book hub",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new book status
  const handleCreateBookStatus = async () => {
    if (!newBookStatusData.name.trim() || !newBookStatusData.value.trim()) {
      showErrorAlert("Status name and value are required");
      return;
    }

    try {
      const response = await bookStatusesApi.create({
        name: newBookStatusData.name.trim(),
        value: newBookStatusData.value.trim(),
        description: newBookStatusData.description.trim() || undefined,
        color: newBookStatusData.color,
      });

      if (response.success) {
        setBookStatusesList([...bookStatusesList, response.data]);
        setSelectedBook({
          ...selectedBook,
          status: response.data.value as any,
        });
        setNewBookStatusData({
          name: "",
          value: "",
          description: "",
          color: "#757575",
        });
        setBookStatusDialogOpen(false);
        showSuccessAlert(
          `Status "${response.data.name}" created successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating book status:", error);
      showErrorAlert(
        "Failed to create status",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new GST percentage
  const handleCreateGst = async () => {
    if (newGstData.percentage === undefined || newGstData.percentage === null) {
      showErrorAlert("GST percentage is required");
      return;
    }

    try {
      const response = await gstApi.create(newGstData.percentage);

      if (response.success) {
        setGstList((prev) =>
          [...prev, response.data].sort((a, b) => a.percentage - b.percentage),
        );
        setSelectedBook({ ...selectedBook, gst: response.data.percentage });
        setNewGstData({ percentage: 0 });
        setGstDialogOpen(false);
        showSuccessAlert(
          `${response.data.percentage}% GST added successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating GST:", error);
      showErrorAlert(
        "Failed to create GST",
        error.message || "Please try again",
      );
    }
  };

  // Handler for creating new Language
  const handleCreateLanguage = async () => {
    if (!newLanguageData.name.trim()) {
      showErrorAlert("Language name is required");
      return;
    }

    try {
      const response = await languageApi.createLanguage({
        name: newLanguageData.name.trim(),
        isActive: true,
        sortOrder: 0,
      });

      if (response.success) {
        setLanguageList((prev) =>
          [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setSelectedBook({ ...selectedBook, language: response.data.name });
        setNewLanguageData({ name: "" });
        setLanguageDialogOpen(false);
        showSuccessAlert(
          `Language "${response.data.name}" added successfully!`,
        );
      }
    } catch (error: any) {
      console.error("Error creating Language:", error);
      showErrorAlert(
        "Failed to create Language",
        error.message || "Please try again",
      );
    }
  };

  return (
    <Box>
      <BooksTopControls
        apiAvailable={apiAvailable}
        loadInitialData={loadInitialData}
        loading={loading}
        handleDialogOpen={handleDialogOpen}
        stats={stats}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        categories={categories}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statuses={statuses}
      />
      <AdminBooksTable
        loading={loading}
        filteredBooks={filteredBooks}
        paginatedBooks={paginatedBooks}
        searchQuery={searchQuery}
        filterCategory={filterCategory}
        filterStatus={filterStatus}
        tablePage={tablePage}
        rowsPerPage={rowsPerPage}
        totalTablePages={totalTablePages}
        setTablePage={setTablePage}
        handleDialogOpen={handleDialogOpen}
        handleMenuOpen={handleMenuOpen}
        getStatusColor={getStatusColor}
      />
      <BooksActionMenu
        anchorEl={anchorEl}
        handleMenuClose={handleMenuClose}
        handleDialogOpen={handleDialogOpen}
        books={books}
        menuBookId={menuBookId}
        toggleFeatured={toggleFeatured}
        handleArchiveBook={handleArchiveBook}
        handleDeleteBook={handleDeleteBook}
      />
      <BooksDialogs
        dialogOpen={dialogOpen}
        books={books}
        handleDialogClose={handleDialogClose}
        dialogMode={dialogMode}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        categories={categories}
        setCategoryDialogOpen={setCategoryDialogOpen}
        bookTypes={bookTypes}
        setBookTypeDialogOpen={setBookTypeDialogOpen}
        bookFormats={bookFormats}
        setBookFormatDialogOpen={setBookFormatDialogOpen}
        bookHubs={bookHubs}
        setBookHubDialogOpen={setBookHubDialogOpen}
        bookStatusesList={bookStatusesList}
        setBookStatusDialogOpen={setBookStatusDialogOpen}
        gstList={gstList}
        setGstDialogOpen={setGstDialogOpen}
        languageList={languageList}
        setLanguageDialogOpen={setLanguageDialogOpen}
        isReadOnlyMode={isReadOnlyMode}
        statuses={statuses}
        imagePreview={imagePreview}
        imageFile={imageFile}
        bookFile={bookFile}
        audioFile={audioFile}
        bookFilePreview={bookFilePreview}
        audioFilePreview={audioFilePreview}
        coverInputRef={coverInputRef}
        ebookInputRef={ebookInputRef}
        audioInputRef={audioInputRef}
        handleImageUpload={handleImageUpload}
        handleBookFileUpload={handleBookFileUpload}
        handleAudioFileUpload={handleAudioFileUpload}
        handleRemoveImage={handleRemoveImage}
        handleRemoveBookFile={handleRemoveBookFile}
        handleRemoveAudioFile={handleRemoveAudioFile}
        openUploadPicker={openUploadPicker}
        getUploadZoneStateSx={getUploadZoneStateSx}
        handleUploadZoneDragEnter={handleUploadZoneDragEnter}
        handleUploadZoneDragOver={handleUploadZoneDragOver}
        handleUploadZoneDragLeave={handleUploadZoneDragLeave}
        handleUploadZoneDrop={handleUploadZoneDrop}
        handleUploadZoneKeyDown={handleUploadZoneKeyDown}
        dragOverTarget={dragOverTarget}
        submitting={submitting}
        handleSaveBook={handleSaveBook}
        confirmDialog={confirmDialog}
        handleConfirmDialogClose={handleConfirmDialogClose}
        snackbar={snackbar}
        setSnackbar={setSnackbar}
        loading={loading}
        categoryDialogOpen={categoryDialogOpen}
        newCategoryData={newCategoryData}
        setNewCategoryData={setNewCategoryData}
        handleCreateCategory={handleCreateCategory}
        bookTypeDialogOpen={bookTypeDialogOpen}
        newBookTypeData={newBookTypeData}
        setNewBookTypeData={setNewBookTypeData}
        handleCreateBookType={handleCreateBookType}
        bookFormatDialogOpen={bookFormatDialogOpen}
        newBookFormatData={newBookFormatData}
        setNewBookFormatData={setNewBookFormatData}
        handleCreateBookFormat={handleCreateBookFormat}
        bookHubDialogOpen={bookHubDialogOpen}
        newBookHubData={newBookHubData}
        setNewBookHubData={setNewBookHubData}
        handleCreateBookHub={handleCreateBookHub}
        bookStatusDialogOpen={bookStatusDialogOpen}
        newBookStatusData={newBookStatusData}
        setNewBookStatusData={setNewBookStatusData}
        handleCreateBookStatus={handleCreateBookStatus}
        gstDialogOpen={gstDialogOpen}
        newGstData={newGstData}
        setNewGstData={setNewGstData}
        handleCreateGst={handleCreateGst}
        languageDialogOpen={languageDialogOpen}
        newLanguageData={newLanguageData}
        setNewLanguageData={setNewLanguageData}
        handleCreateLanguage={handleCreateLanguage}
      />{" "}
    </Box>
  );
}
