import { Search, UserCircle, ArrowLeft, Bookmark } from "lucide-react";

interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  showBookmark?: boolean;
  onBack?: () => void;
  onBookmark?: () => void;
}

export function MobileHeader({ 
  title, 
  showBackButton = false, 
  showBookmark = false,
  onBack,
  onBookmark 
}: MobileHeaderProps) {
  return (
    <header className="bg-primary text-white p-4 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <button onClick={onBack} className="text-white hover:text-green-200">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <i className="fas fa-barcode text-xl"></i>
              <span className="text-lg font-semibold">NutriScan</span>
            </div>
          )}
          {!showBackButton && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
          {showBackButton && (
            <h1 className="text-lg font-semibold flex-1">{title}</h1>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {showBookmark && (
            <button onClick={onBookmark} className="text-white hover:text-green-200">
              <Bookmark className="h-5 w-5" />
            </button>
          )}
          {!showBackButton && (
            <>
              <Search className="h-5 w-5 cursor-pointer hover:text-green-200" />
              <UserCircle className="h-5 w-5 cursor-pointer hover:text-green-200" />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
