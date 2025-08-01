import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useConnectAmazonSeller, Region } from '@/lib/hooks/queries/use-amazon-seller';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe2, Search, AlertTriangle } from 'lucide-react';
import { 
  MARKETPLACE_IDS, 
  AVAILABLE_COUNTRIES, 
  COUNTRY_TO_MARKETPLACE, 
  COUNTRY_TO_REGION,
  MARKETPLACE_NAMES
} from '@/lib/constants/amazon-marketplaces';

interface RegionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RegionDialog({ isOpen, onOpenChange }: RegionDialogProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { user } = useAuth();
  const { mutateAsync, isPending } = useConnectAmazonSeller();

  const filteredCountries = AVAILABLE_COUNTRIES.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
  };

  const handleConnect = async () => {
    if (!user || !selectedCountry) return;

    const marketplaceCode = COUNTRY_TO_MARKETPLACE[selectedCountry];
    const region = COUNTRY_TO_REGION[selectedCountry];
    const marketplaceId = (MARKETPLACE_IDS as any)[region][marketplaceCode];

    try {
      const response = await mutateAsync({
        userId: user.uid,
        region,
        marketplaceId
      });

      // Redirect to Amazon authorization URL
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error('Failed to connect seller account:', error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedCountry('');
      setSearchTerm('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Your Country</DialogTitle>
          <DialogDescription>
            Choose the country where your Amazon Seller account is registered.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          {/* Country List */}
          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 country-list" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#6b7280 transparent'
            }}>
            <style>
              {`
                .country-list::-webkit-scrollbar {
                  width: 6px;
                }
                .country-list::-webkit-scrollbar-track {
                  background: transparent;
                }
                .country-list::-webkit-scrollbar-thumb {
                  background: #6b7280;
                  border-radius: 3px;
                }
                .country-list::-webkit-scrollbar-thumb:hover {
                  background: #4b5563;
                }
              `}
            </style>
            {filteredCountries.map((country) => (
              <button
                key={country}
                className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selectedCountry === country
                    ? 'border-yellow-500 bg-yellow-50 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-50/50'
                }`}
                onClick={() => handleCountrySelect(country)}
              >
                <Globe2 className={`h-4 w-4 flex-shrink-0 ${selectedCountry === country ? 'text-yellow-600' : 'text-gray-500'}`} />
                <span className={`font-medium ${selectedCountry === country ? 'text-yellow-700' : 'text-gray-900'}`}>
                  {country}
                </span>
              </button>
            ))}
            
            {filteredCountries.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No countries found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="border-gray-400 text-gray-200 hover:bg-gray-100 hover:text-gray-900"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isPending || !selectedCountry}
            className="bg-amazon hover:bg-amazon/90 text-white shadow-sm disabled:opacity-50"
          >
            {isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full mr-2" />
                Connecting...
              </>
            ) : (
              'Connect to Amazon'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}