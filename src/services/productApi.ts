import { default as api } from './api';

export interface ProductFormat {
  formatType: 'physical' | 'ebook' | 'audiobook';
  price: number;
  discountPrice?: number;  // Changed to match backend DTO
  stockQuantity?: number;
  isAvailable: boolean;
  file?: File;
  fileType?: string;
  fileSize?: number;
  isbn?: string;
  sku?: string;
  isTrackable?: boolean;
  fileUrl?: string;
}

export interface InpProductCreationDto {
  Title: string;
  Slug: string;
  Subtitle?: string;
  Description: string;
  ISBN?: string;
  PublicationDate?: string;
  Language: string;
  Pages?: number;
  Dimensions?: string;
  Weight?: number;
  AgeGroup?: string;
  Edition?: string;
  Series?: string;
  Volume?: number;
  IsActive: boolean;
  MetaTitle: string;
  MetaDescription: string;
  MetaKeywords: string;
  PublisherId: string;
  CategoryId: string;
  Formats: Array<{
    FormatType: string;
    FileType?: string;
    ISBN?: string;
    SKU?: string;
    Price: number;
    DiscountPrice?: number;
    IsAvailable: boolean;
    StockQuantity?: number;
    IsTrackable: boolean;
    FileUrl?: string;
    FormFromatFile?: File;
  }>;
  Authors: Array<{
    AuthorId: string;
    AuthorName: string;
    Role?: string;
    DisplayOrder?: number;
  }>;
  Attributes?: Array<{
    CategoryAttributeId: string;
    Value: string;
  }>;
  Tags: Array<{
    Name: string;
    Slug?: string;
    Description?: string;
    IsActive: boolean;
    CreatedBy?: string;
  }>;
  Media: Array<{
    MediaRole: string;
    IsMain: boolean;
    Title?: string;
    Description?: string;
    SortOrder: number;
    FormFile: File;
  }>;
  coverImage?: File;  // Helper property for UI
  backCoverImage?: File;  // Helper property for UI
  galleryImages?: File[];  // Helper property for UI
}

export const productApi = {
  getCreationModel: async () => {
    return api.get('/product/creation-model');
  },

  add: async (data: InpProductCreationDto) => {
    const validateRequiredFields = (data: InpProductCreationDto) => {
      const requiredFields = [
        { value: data.Title?.trim(), field: 'Title' },
        { value: data.Description?.trim(), field: 'Description' },
        { value: data.Language?.trim(), field: 'Language' },
        { value: data.CategoryId?.toString(), field: 'Category' },
      ];

      for (const { value, field } of requiredFields) {
        if (!value) {
          throw new Error(`${field} is required`);
        }
      }

      // Validate arrays have required items
      if (!data.Formats?.length) throw new Error('At least one format is required');
      if (!data.Authors?.length) throw new Error('At least one author is required');

      // Validate required fields within formats
      data.Formats.forEach((format, index) => {
        if (!format.FormatType) throw new Error(`Format type is required for format ${index + 1}`);
        if (format.Price === undefined || format.Price === null) throw new Error(`Price is required for format ${index + 1}`);
        if (format.IsAvailable === undefined) throw new Error(`Availability status is required for format ${index + 1}`);

        // StockQuantity must only be present for physical formats
        if (format.FormatType !== 'physical' && format.StockQuantity !== undefined) {
          throw new Error(`StockQuantity must only be provided for physical formats (format ${index + 1})`);
        }

        // Check file requirement for digital formats
        if ((format.FormatType === 'ebook' || format.FormatType === 'audiobook') && !format.FormFromatFile) {
          throw new Error(`File is required for ${format.FormatType} format ${index + 1}`);
        }
      });
    };

    // Validate all required fields before proceeding
    validateRequiredFields(data);

    const formData = new FormData();

    // Add required fields
    formData.append('Title', data.Title);
    formData.append('Slug', data.Slug);
    formData.append('Description', data.Description);
    formData.append('Language', data.Language);
    formData.append('IsActive', data.IsActive.toString());
    formData.append('CategoryId', data.CategoryId);
    formData.append('PublisherId', data.PublisherId);
    formData.append('MetaTitle', data.MetaTitle);
    formData.append('MetaDescription', data.MetaDescription);
    formData.append('MetaKeywords', data.MetaKeywords);

    // Add optional metadata fields
    if (data.Subtitle) formData.append('Subtitle', data.Subtitle);
    if (data.ISBN) formData.append('ISBN', data.ISBN);
    if (data.PublicationDate) formData.append('PublicationDate', data.PublicationDate);
    if (data.Pages) formData.append('Pages', data.Pages.toString());
    if (data.Dimensions) formData.append('Dimensions', data.Dimensions);
    if (data.Weight) formData.append('Weight', data.Weight.toString());
    if (data.AgeGroup) formData.append('AgeGroup', data.AgeGroup);
    if (data.Edition) formData.append('Edition', data.Edition);
    if (data.Series) formData.append('Series', data.Series);
    if (data.Volume) formData.append('Volume', data.Volume.toString());

    // Add formats
    data.Formats.forEach((format, index) => {
      formData.append(`Formats[${index}].FormatType`, format.FormatType);
    formData.append(`Formats[${index}].Price`, format.Price.toString());
    formData.append(`Formats[${index}].IsAvailable`, format.IsAvailable.toString());
    // Derive IsTrackable from FormatType: true for physical, false for digital
    const derivedIsTrackable = format.FormatType === 'physical';
    formData.append(`Formats[${index}].IsTrackable`, derivedIsTrackable.toString());

      if (format.FormFromatFile) {
        formData.append(`Formats[${index}].FormFromatFile`, format.FormFromatFile, format.FormFromatFile.name);
      }
      if (format.DiscountPrice !== undefined) {
        formData.append(`Formats[${index}].DiscountPrice`, format.DiscountPrice.toString());
      }
      // Only include StockQuantity for physical formats
      if (format.FormatType === 'physical' && format.StockQuantity !== undefined) {
        formData.append(`Formats[${index}].StockQuantity`, format.StockQuantity.toString());
      }
      if (format.ISBN) formData.append(`Formats[${index}].ISBN`, format.ISBN);
      if (format.SKU) formData.append(`Formats[${index}].SKU`, format.SKU);
      if (format.FileType) formData.append(`Formats[${index}].FileType`, format.FileType);
    });

    // Add authors
    data.Authors.forEach((author, index) => {
      formData.append(`Authors[${index}].AuthorId`, author.AuthorId);
      formData.append(`Authors[${index}].AuthorName`, author.AuthorName);
      if (author.Role) formData.append(`Authors[${index}].Role`, author.Role);
      if (author.DisplayOrder) formData.append(`Authors[${index}].DisplayOrder`, author.DisplayOrder.toString());
    });

    // Add tags if they exist
    if (data.Tags?.length) {
      data.Tags.forEach((tag, index) => {
        formData.append(`Tags[${index}].Name`, tag.Name);
        formData.append(`Tags[${index}].IsActive`, tag.IsActive.toString());
        if (tag.Slug) formData.append(`Tags[${index}].Slug`, tag.Slug);
        if (tag.Description) formData.append(`Tags[${index}].Description`, tag.Description);
        if (tag.CreatedBy) formData.append(`Tags[${index}].CreatedBy`, tag.CreatedBy);
      });
    }

    // Add attributes (category attributes -> product attribute values)
    if (data.Attributes?.length) {
      data.Attributes.forEach((attr, index) => {
        formData.append(`Attributes[${index}].CategoryAttributeId`, attr.CategoryAttributeId);
        formData.append(`Attributes[${index}].Value`, attr.Value);
      });
    }

    // Add media files
    if (data.coverImage || data.backCoverImage || data.galleryImages?.length) {
      const media = [];
      if (data.coverImage) {
        media.push({
          MediaRole: 'cover',
          IsMain: true,
          FormFile: data.coverImage,
          SortOrder: 0
        });
      }
      if (data.backCoverImage) {
        media.push({
          MediaRole: 'backCover',
          IsMain: false,
          FormFile: data.backCoverImage,
          SortOrder: 1
        });
      }
      if (data.galleryImages?.length) {
        data.galleryImages.forEach((file, index) => {
          media.push({
            MediaRole: 'gallery',
            IsMain: false,
            FormFile: file,
            SortOrder: index + 2
          });
        });
      }
      
      media.forEach((mediaItem, index) => {
        formData.append(`Media[${index}].MediaRole`, mediaItem.MediaRole);
        formData.append(`Media[${index}].IsMain`, mediaItem.IsMain.toString());
        formData.append(`Media[${index}].SortOrder`, mediaItem.SortOrder.toString());
        formData.append(`Media[${index}].FormFile`, mediaItem.FormFile, mediaItem.FormFile.name);
      });
    }

    return api.post('/product/add', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
  },

  update: async (productId: string, data: InpProductCreationDto) => {
    // Ensure productId is a valid string
    const productIdString = String(productId).trim();
    if (!productIdString) {
      throw new Error('Product ID is required');
    }
    const validateRequiredFields = (data: InpProductCreationDto) => {
      const requiredFields = [
        { value: data.Title?.trim(), field: 'Title' },
        { value: data.Description?.trim(), field: 'Description' },
        { value: data.Language?.trim(), field: 'Language' },
        { value: data.CategoryId?.toString(), field: 'Category' },
      ];

      for (const { value, field } of requiredFields) {
        if (!value) {
          throw new Error(`${field} is required`);
        }
      }

      if (!data.Formats?.length) throw new Error('At least one format is required');
      if (!data.Authors?.length) throw new Error('At least one author is required');

      data.Formats.forEach((format, index) => {
        if (!format.FormatType) throw new Error(`Format type is required for format ${index + 1}`);
        if (format.Price === undefined || format.Price === null) throw new Error(`Price is required for format ${index + 1}`);
        if (format.IsAvailable === undefined) throw new Error(`Availability status is required for format ${index + 1}`);

        if (format.FormatType !== 'physical' && format.StockQuantity !== undefined) {
          throw new Error(`StockQuantity must only be provided for physical formats (format ${index + 1})`);
        }
      });
    };

    validateRequiredFields(data);

    const formData = new FormData();

    formData.append('Title', data.Title);
    formData.append('Slug', data.Slug);
    formData.append('Description', data.Description);
    formData.append('Language', data.Language);
    formData.append('IsActive', data.IsActive.toString());
    formData.append('CategoryId', data.CategoryId);
    formData.append('PublisherId', data.PublisherId);
    formData.append('MetaTitle', data.MetaTitle);
    formData.append('MetaDescription', data.MetaDescription);
    formData.append('MetaKeywords', data.MetaKeywords);

    if (data.Subtitle) formData.append('Subtitle', data.Subtitle);
    if (data.ISBN) formData.append('ISBN', data.ISBN);
    if (data.PublicationDate) formData.append('PublicationDate', data.PublicationDate);
    if (data.Pages) formData.append('Pages', data.Pages.toString());
    if (data.Dimensions) formData.append('Dimensions', data.Dimensions);
    if (data.Weight) formData.append('Weight', data.Weight.toString());
    if (data.AgeGroup) formData.append('AgeGroup', data.AgeGroup);
    if (data.Edition) formData.append('Edition', data.Edition);
    if (data.Series) formData.append('Series', data.Series);
    if (data.Volume) formData.append('Volume', data.Volume.toString());

    data.Formats.forEach((format, index) => {
      formData.append(`Formats[${index}].FormatType`, format.FormatType);
      formData.append(`Formats[${index}].Price`, format.Price.toString());
      formData.append(`Formats[${index}].IsAvailable`, format.IsAvailable.toString());
      const derivedIsTrackable = format.FormatType === 'physical';
      formData.append(`Formats[${index}].IsTrackable`, derivedIsTrackable.toString());

      if (format.FormFromatFile) {
        formData.append(`Formats[${index}].FormFromatFile`, format.FormFromatFile, format.FormFromatFile.name);
      }
      if (format.DiscountPrice !== undefined) {
        formData.append(`Formats[${index}].DiscountPrice`, format.DiscountPrice.toString());
      }
      if (format.FormatType === 'physical' && format.StockQuantity !== undefined) {
        formData.append(`Formats[${index}].StockQuantity`, format.StockQuantity.toString());
      }
      if (format.ISBN) formData.append(`Formats[${index}].ISBN`, format.ISBN);
      if (format.SKU) formData.append(`Formats[${index}].SKU`, format.SKU);
      if (format.FileType) formData.append(`Formats[${index}].FileType`, format.FileType);
    });

    data.Authors.forEach((author, index) => {
      formData.append(`Authors[${index}].AuthorId`, author.AuthorId);
      formData.append(`Authors[${index}].AuthorName`, author.AuthorName);
      if (author.Role) formData.append(`Authors[${index}].Role`, author.Role);
      if (author.DisplayOrder) formData.append(`Authors[${index}].DisplayOrder`, author.DisplayOrder.toString());
    });

    if (data.Tags?.length) {
      data.Tags.forEach((tag, index) => {
        formData.append(`Tags[${index}].Name`, tag.Name);
        formData.append(`Tags[${index}].IsActive`, tag.IsActive.toString());
        if (tag.Slug) formData.append(`Tags[${index}].Slug`, tag.Slug);
        if (tag.Description) formData.append(`Tags[${index}].Description`, tag.Description);
        if (tag.CreatedBy) formData.append(`Tags[${index}].CreatedBy`, tag.CreatedBy);
      });
    }

    if (data.Attributes?.length) {
      data.Attributes.forEach((attr, index) => {
        formData.append(`Attributes[${index}].CategoryAttributeId`, attr.CategoryAttributeId);
        formData.append(`Attributes[${index}].Value`, attr.Value);
      });
    }

    if (data.coverImage || data.backCoverImage || data.galleryImages?.length) {
      const media = [];
      if (data.coverImage) {
        media.push({
          MediaRole: 'cover',
          IsMain: true,
          FormFile: data.coverImage,
          SortOrder: 0
        });
      }
      if (data.backCoverImage) {
        media.push({
          MediaRole: 'backCover',
          IsMain: false,
          FormFile: data.backCoverImage,
          SortOrder: 1
        });
      }
      if (data.galleryImages?.length) {
        data.galleryImages.forEach((file, index) => {
          media.push({
            MediaRole: 'gallery',
            IsMain: false,
            FormFile: file,
            SortOrder: index + 2
          });
        });
      }
      
      media.forEach((mediaItem, index) => {
        formData.append(`Media[${index}].MediaRole`, mediaItem.MediaRole);
        formData.append(`Media[${index}].IsMain`, mediaItem.IsMain.toString());
        formData.append(`Media[${index}].SortOrder`, mediaItem.SortOrder.toString());
        formData.append(`Media[${index}].FormFile`, mediaItem.FormFile, mediaItem.FormFile.name);
      });
    }

    return api.put(`/product/update/${productIdString}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
  },

  delete: async (productId: string) => {
    return api.delete(`/product/delete/${productId}`, {
      withCredentials: true
    });
  },

  addISBN: async (productFormatId: string, isbn: string, approvalNotes?: string) => {
    if (!productFormatId || !productFormatId.trim()) {
      throw new Error('Product Format ID is required');
    }
    if (!isbn || !isbn.trim()) {
      throw new Error('ISBN is required');
    }
    if (isbn.trim().length > 17) {
      throw new Error('ISBN cannot exceed 17 characters');
    }
    if (approvalNotes && approvalNotes.length > 500) {
      throw new Error('Approval notes cannot exceed 500 characters');
    }

    return api.put('/format/add-isbn', {
      ProductFormatId: productFormatId.trim(),
      ISBN: isbn.trim(),
      ApprovalNotes: approvalNotes?.trim()
    }, {
      withCredentials: true
    });
  },

  save: async (data: any) => {
    const formData = new FormData();

    formData.append('ProductId', data.ProductId);
    formData.append('Title', data.Title);
    if (data.Subtitle) formData.append('Subtitle', data.Subtitle);
    formData.append('Description', data.Description);
    if (data.ISBN) formData.append('ISBN', data.ISBN);
    if (data.PublicationDate) formData.append('PublicationDate', data.PublicationDate);
    formData.append('Language', data.Language);
    if (data.Pages) formData.append('Pages', data.Pages.toString());
    if (data.Dimensions) formData.append('Dimensions', data.Dimensions);
    if (data.Weight) formData.append('Weight', data.Weight.toString());
    if (data.AgeGroup) formData.append('AgeGroup', data.AgeGroup);
    if (data.Edition) formData.append('Edition', data.Edition);
    if (data.Series) formData.append('Series', data.Series);
    if (data.Volume) formData.append('Volume', data.Volume.toString());
    if (data.IsActive !== undefined) formData.append('IsActive', data.IsActive.toString());
    if (data.MetaTitle) formData.append('MetaTitle', data.MetaTitle);
    if (data.MetaDescription) formData.append('MetaDescription', data.MetaDescription);
    if (data.MetaKeywords) formData.append('MetaKeywords', data.MetaKeywords);
    formData.append('PublisherId', data.PublisherId);
    formData.append('CategoryId', data.CategoryId);

    if (data.Formats && data.Formats.length > 0) {
      data.Formats.forEach((format: any, index: number) => {
        formData.append(`Formats[${index}].Id`, format.Id);
        formData.append(`Formats[${index}].ProductId`, format.ProductId);
        formData.append(`Formats[${index}].FormatType`, format.FormatType);
        if (format.FileType) formData.append(`Formats[${index}].FileType`, format.FileType);
        if (format.ISBN) formData.append(`Formats[${index}].ISBN`, format.ISBN);
        if (format.SKU) formData.append(`Formats[${index}].SKU`, format.SKU);
        formData.append(`Formats[${index}].Price`, format.Price.toString());
        if (format.DiscountPrice) formData.append(`Formats[${index}].DiscountPrice`, format.DiscountPrice.toString());
        formData.append(`Formats[${index}].IsAvailable`, format.IsAvailable.toString());
        if (format.StockQuantity) formData.append(`Formats[${index}].StockQuantity`, format.StockQuantity.toString());
        formData.append(`Formats[${index}].IsTrackable`, format.IsTrackable.toString());
        if (format.CreatedAt) formData.append(`Formats[${index}].CreatedAt`, format.CreatedAt);
        if (format.FileUrl) formData.append(`Formats[${index}].FileUrl`, format.FileUrl);
        if (format.FileSize) formData.append(`Formats[${index}].FileSize`, format.FileSize.toString());
        if (format.FormFormatFile) {
          formData.append(`Formats[${index}].FormFormatFile`, format.FormFormatFile, format.FormFormatFile.name);
        }
      });
    }

    if (data.Authors && data.Authors.length > 0) {
      data.Authors.forEach((author: any, index: number) => {
        formData.append(`Authors[${index}].Id`, author.Id);
        formData.append(`Authors[${index}].AuthorId`, author.AuthorId);
        formData.append(`Authors[${index}].AuthorName`, author.AuthorName);
        if (author.Role) formData.append(`Authors[${index}].Role`, author.Role);
        if (author.DisplayOrder) formData.append(`Authors[${index}].DisplayOrder`, author.DisplayOrder.toString());
      });
    }

    if (data.Media !== undefined && data.Media !== null && Array.isArray(data.Media)) {
      if (data.Media.length > 0) {
        data.Media.forEach((media: any, index: number) => {
          if (media.Id) formData.append(`Media[${index}].Id`, media.Id);
          formData.append(`Media[${index}].ProductId`, media.ProductId);
          if (media.ProductFormatId) formData.append(`Media[${index}].ProductFormatId`, media.ProductFormatId);
          formData.append(`Media[${index}].MediaRole`, media.MediaRole);
          formData.append(`Media[${index}].IsMain`, media.IsMain.toString());
          if (media.Title) formData.append(`Media[${index}].Title`, media.Title);
          if (media.Description) formData.append(`Media[${index}].Description`, media.Description);
          if (media.SortOrder !== undefined) formData.append(`Media[${index}].SortOrder`, media.SortOrder.toString());
          if (media.IsDeleted !== undefined) formData.append(`Media[${index}].IsDeleted`, media.IsDeleted.toString());
          if (media.FormFile) {
            formData.append(`Media[${index}].FormFile`, media.FormFile, media.FormFile.name);
          }
        });
      }
    }

    if (data.Tags && data.Tags.length > 0) {
      data.Tags.forEach((tag: any, index: number) => {
        formData.append(`Tags[${index}].Id`, tag.Id);
        formData.append(`Tags[${index}].Name`, tag.Name);
        if (tag.Slug) formData.append(`Tags[${index}].Slug`, tag.Slug);
        if (tag.Description) formData.append(`Tags[${index}].Description`, tag.Description);
        formData.append(`Tags[${index}].IsActive`, tag.IsActive.toString());
        if (tag.CreatedAt) formData.append(`Tags[${index}].CreatedAt`, tag.CreatedAt);
        if (tag.CreatedBy) formData.append(`Tags[${index}].CreatedBy`, tag.CreatedBy);
      });
    }

    return api.put('/product/save', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });
  }
};