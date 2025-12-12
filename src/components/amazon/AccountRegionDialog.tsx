import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useConnectAmazonAccount, AccountType, Region } from '@/lib/hooks/queries/use-amazon-seller';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe2, Search, Store, Building2, ArrowLeft } from 'lucide-react';
import { 
  MARKETPLACE_IDS, 
  AVAILABLE_COUNTRIES, 
  COUNTRY_TO_MARKETPLACE, 
  COUNTRY_TO_REGION,
} from '@/lib/constants/amazon-marketplaces';

interface AccountRegionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'account-type' | 'region';

export function AccountRegionDialog({ isOpen, onOpenChange }: AccountRegionDialogProps) {
  const [step, setStep] = useState<Step>('account-type');
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { user } = useAuth();
  const { mutateAsync, isPending } = useConnectAmazonAccount();

  const filteredCountries = AVAILABLE_COUNTRIES.filter(country =>
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAccountTypeSelect = (type: AccountType) => {
    setSelectedAccountType(type);
    setStep('region');
  };

  const handleBack = () => {
    setStep('account-type');
    setSelectedCountry('');
    setSearchTerm('');
  };

  const handleCountrySelect = (country: string) => {
    setSelectedCountry(country);
  };

  const handleConnect = async () => {
    if (!user || !selectedCountry || !selectedAccountType) return;

    const marketplaceCode = COUNTRY_TO_MARKETPLACE[selectedCountry];
    const region = COUNTRY_TO_REGION[selectedCountry];
    // const marketplaceId = (MARKETPLACE_IDS as any)[region][marketplaceCode];
    const marketplaceId = marketplaceCode;

    try {
      console.log('Region : ', region)
      const response = await mutateAsync({
        userId: user.uid,
        region,
        marketplaceId,
        accountType: selectedAccountType
      });

      // Redirect to Amazon authorization URL
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error('Failed to connect account:', error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset all state when dialog closes
      setStep('account-type');
      setSelectedAccountType(null);
      setSelectedCountry('');
      setSearchTerm('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'region' && (
              <button 
                onClick={handleBack}
                className="mr-1 p-1 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
            )}
            {step === 'account-type' ? 'Select Account Type' : 'Select Your Country'}
          </DialogTitle>
          <DialogDescription>
            {step === 'account-type' 
              ? 'Choose whether you want to connect a Seller or Vendor account.'
              : `Choose the country where your Amazon ${selectedAccountType === 'seller' ? 'Seller' : 'Vendor'} account is registered.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {step === 'account-type' ? (
            /* STEP 1: Account Type Selection */
            <div className="grid gap-4">
              {/* Seller Account Option */}
              <button
                onClick={() => handleAccountTypeSelect('seller')}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-orange-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-200 transition-colors">
                    <Store className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Seller Account</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Connect your Amazon Seller Central account to manage inventory, orders, and sales data.
                    </p>
                  </div>
                </div>
              </button>

              {/* Vendor Account Option */}
              <button
                onClick={() => handleAccountTypeSelect('vendor')}
                className="group relative overflow-hidden rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-blue-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Vendor Account</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Connect your Amazon Vendor Central account to manage wholesale relationships and bulk orders.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* STEP 2: Region/Country Selection */
            <div className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search countries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-yellow-500 text-white focus:ring-yellow-500"
                  autoFocus
                />
              </div>

              {/* Country List */}
              <div 
                className="max-h-[320px] overflow-y-auto space-y-2 pr-2 country-list" 
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#6b7280 transparent'
                }}
              >
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
                    className={`w-full flex items-center gap-3 rounded-lg border-2 p-3.5 text-left transition-all ${
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
                  <div className="text-center py-12 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No countries found</p>
                    <p className="text-sm mt-1">Try searching with a different term</p>
                  </div>
                )}
              </div>

              {/* Connect Button */}
              <div className="pt-4 border-t flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-gray-300"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConnect}
                  disabled={isPending || !selectedCountry}
                  className="flex-1 bg-amazon hover:bg-amazon/90 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-transparent rounded-full mr-2" />
                      Connecting...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}