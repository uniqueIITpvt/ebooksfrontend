import { booksApi, type Book, type BookPayload } from '@/services/api/booksApi';
import { getNumericBookValue } from '../formatters';

type BookSaveHandlerContext = Record<string, any>;

export function createHandleSaveBook(ctx: BookSaveHandlerContext) {
  const {
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
  } = ctx;
  const handleSaveBook = async () => {
    if (!selectedBook) return;

    const isAudiobook =
      (selectedBook as any)?.type === "Audiobook" ||
      (Array.isArray(selectedBook.format)
        ? selectedBook.format.includes("Audiobook")
        : false);

    const existingAudiobookUrl =
      (selectedBook as any)?.files?.audiobook?.url ||
      (selectedBook as any)?.audiobookUrl ||
      (selectedBook as any)?.fileUrls?.audiobook;

    if (isAudiobook && !audioFile && !existingAudiobookUrl) {
      showErrorAlert(
        "Audiobook file is required",
        "Please upload an audiobook file before saving.",
      );
      return;
    }

    // Validate the book data
    const errors = validateBook(selectedBook);
    setValidationErrors(errors);

    // If there are validation errors, don't proceed
    if (Object.keys(errors).length > 0) {
      showErrorAlert("Please fix the validation errors before saving");
      return;
    }

    try {
      setSubmitting(true);

      // Sanitize the data
      const coercedFormat =
        selectedBook.format && selectedBook.format.length > 0
          ? selectedBook.format
          : ["E-book"];

      const normalizedFormat = isAudiobook
        ? Array.from(new Set([...coercedFormat, "Audiobook"]))
        : coercedFormat;

      const sanitizedBook: BookPayload = {
        title: selectedBook.title?.trim() || "",
        author: selectedBook.author?.trim() || "",
        category: selectedBook.category?.trim() || "",
        description: selectedBook.description?.trim() || "",
        type: isAudiobook ? "Audiobook" : selectedBook.type || "Books",
        componentType: selectedBook.componentType || "none",
        price: Number(selectedBook.discountPrice) || 0,
        format: normalizedFormat, // Default to E-book if no format specified; ensure Audiobook format matches type
        featured: selectedBook.featured || false,
        bestseller: selectedBook.bestseller || false,
        status: selectedBook.status || "draft",
        tags: selectedBook.tags || [],
        publishDate:
          selectedBook.publishDate || new Date().toISOString().split("T")[0],
        isbn: selectedBook.isbn?.trim() || undefined,
        pages: selectedBook.pages ? Number(selectedBook.pages) : undefined,
        rating: selectedBook.rating,
        reviews: selectedBook.reviews,
        sales: getNumericBookValue(selectedBook.sales),
        originalPrice: selectedBook.originalPrice,
        duration: selectedBook.duration,
        narrator: selectedBook.narrator,
        image: imageFile
          ? undefined
          : selectedBook.coverImage || selectedBook.image,
        subtitle: selectedBook.subtitle,
        gst: selectedBook.gst,
        language: selectedBook.language || "English",
      };

      // Collect files for upload
      const filesToUpload = {
        coverImage: imageFile || undefined,
        ebookFile: bookFile || undefined,
        audiobookFile: audioFile || undefined,
      };

      // Check if we have any files to upload
      const hasFiles = Object.values(filesToUpload).some(
        (file) => file !== undefined,
      );

      if (dialogMode === "add") {
        try {
          let response;
          if (hasFiles) {
            response = await booksApi.createBookWithFiles(
              sanitizedBook,
              filesToUpload,
            );
          } else {
            response = await booksApi.createBook(sanitizedBook);
          }

          if (response.success) {
            showSuccessAlert("Book added successfully!");
            await loadInitialData(); // Refresh data
            handleDialogClose();
            const slug = response.data?.slug;
            if (slug) {
              fetch("/api/revalidate/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
              }).catch(() => {});
            }
          } else {
            showErrorAlert("Failed to add book", "Server returned an error");
          }
        } catch (error: any) {
          console.error("Error creating book:", error);

          // Parse error message for better user feedback
          let errorMessage = "Failed to create book";
          let errorDetails = "Please try again";

          const backendMessage =
            error.response?.data?.message ||
            error.response?.data?.error?.message ||
            error.message;

          if (backendMessage) {
            errorMessage = "Validation Error";
            errorDetails = backendMessage;

            // Handle specific validation errors
            if (errorDetails.includes("isbn already exists")) {
              errorDetails =
                "This ISBN already exists. Please remove it or enter a unique ISBN.";
              setValidationErrors((prev: any) => ({
                ...prev,
                isbn: "ISBN already exists",
              }));
            } else if (errorDetails.includes("format")) {
              errorDetails =
                "Invalid book format. Please select a valid format (Hardcover, Paperback, E-book, etc.)";
            } else if (errorDetails.includes("Category does not exist")) {
              errorDetails =
                "Selected category is not valid. Please choose an existing category.";
            } else if (errorDetails.includes("required")) {
              errorDetails =
                "Required fields are missing. Please fill in all required information.";
            }
          }

          // Check if it's a network error (API not available)
          const isNetworkError =
            error.name === "TypeError" ||
            error.name === "AbortError" ||
            error.code === "NETWORK_ERROR" ||
            error.message?.includes("Network Error") ||
            error.message?.includes("Request timeout");

          if (
            isNetworkError &&
            !error.response &&
            !error.status
          ) {
            console.warn("API not available, adding book locally");
            // Fallback: add book locally
            const newBook = {
              ...sanitizedBook,
              id: Date.now().toString(), // Temporary ID
              _id: Date.now().toString(), // Temporary ID
              price: `₹${sanitizedBook.price}`, // Convert to string format
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              publishDate:
                sanitizedBook.publishDate ||
                new Date().toISOString().split("T")[0],
            } as Book;

            setBooks([...books, newBook]);
            showWarningAlert("Book added locally (API not available)");
            handleDialogClose();
          } else {
            // Show specific error to user
            showErrorAlert(errorMessage, errorDetails);
          }
        }
      } else if (dialogMode === "edit" && selectedBook._id) {
        try {
          let response;
          if (hasFiles) {
            response = await booksApi.updateBookWithFiles(
              selectedBook._id,
              sanitizedBook,
              filesToUpload,
            );
          } else {
            response = await booksApi.updateBook(
              selectedBook._id,
              sanitizedBook,
            );
          }

          if (response.success) {
            showSuccessAlert("Book updated successfully!");
            await loadInitialData(); // Refresh data
            handleDialogClose();
            const slug = response.data?.slug;
            if (slug) {
              fetch("/api/revalidate/book", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug }),
              }).catch(() => {});
            }
          } else {
            showErrorAlert("Failed to update book", "Server returned an error");
          }
        } catch (error: any) {
          console.error("Error updating book:", error);

          // Parse error message for better user feedback
          let errorMessage = "Failed to update book";
          let errorDetails = "Please try again";

          const backendMessage =
            error.response?.data?.message ||
            error.response?.data?.error?.message ||
            error.message;

          if (backendMessage) {
            errorMessage = "Validation Error";
            errorDetails = backendMessage;

            // Handle specific validation errors
            if (errorDetails.includes("isbn already exists")) {
              errorDetails =
                "This ISBN already exists. Please remove it or enter a unique ISBN.";
              setValidationErrors((prev: any) => ({
                ...prev,
                isbn: "ISBN already exists",
              }));
            } else if (errorDetails.includes("format")) {
              errorDetails =
                "Invalid book format. Please select a valid format (Hardcover, Paperback, E-book, etc.)";
            } else if (errorDetails.includes("Category does not exist")) {
              errorDetails =
                "Selected category is not valid. Please choose an existing category.";
            } else if (errorDetails.includes("required")) {
              errorDetails =
                "Required fields are missing. Please fill in all required information.";
            }
          }

          // Check if it's a network error (API not available)
          const isNetworkError =
            error.name === "TypeError" ||
            error.name === "AbortError" ||
            error.code === "NETWORK_ERROR" ||
            error.message?.includes("Network Error") ||
            error.message?.includes("Request timeout");

          if (
            isNetworkError &&
            !error.response &&
            !error.status
          ) {
            console.warn("API not available, updating book locally");
            // Fallback: update book locally
            const updatedBooks = books.map((book: any) =>
              (book as any)._id === selectedBook._id ||
              book.id === selectedBook._id
                ? ({
                    ...sanitizedBook,
                    id: selectedBook._id || selectedBook.id || book.id,
                    _id: selectedBook._id || selectedBook.id || book.id,
                    price: `₹${sanitizedBook.price}`, // Convert to string format
                    createdAt:
                      (book as any).createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  } as Book)
                : book,
            );
            setBooks(updatedBooks);
            showWarningAlert("Book updated locally (API not available)");
            handleDialogClose();
          } else {
            // Show specific error to user
            showErrorAlert(errorMessage, errorDetails);
          }
        }
      }
    } catch (error: any) {
      console.error("Error saving book:", error);
      showErrorAlert(
        `Failed to ${dialogMode === "add" ? "add" : "update"} book`,
        error.message || "Please try again",
      );
    } finally {
      setSubmitting(false);
    }
  };
  return handleSaveBook;
}