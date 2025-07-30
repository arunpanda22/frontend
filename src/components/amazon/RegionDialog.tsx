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
import { Globe2, ArrowLeft, Store } from 'lucide-react';
import { MARKETPLACE_IDS, MARKETPLACE_NAMES, type MarketplaceCode } from '@/lib/constants/amazon-marketplaces';

interface RegionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const marketplaceRegions: { id: Region; name: string; description: string; countries: string[] }[] = [
  {
    id: 'NA',
    name: 'North America',
    description: 'North and South American marketplaces',
    countries: ['United States', 'Canada', 'Mexico', 'Brazil']
  },
  {
    id: 'EU',
    name: 'Europe',
    description: 'European, Middle Eastern, and Indian marketplaces',
    countries: [
      'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands',
      'Sweden', 'Poland', 'Egypt', 'Turkey', 'Saudi Arabia', 'United Arab Emirates',
      'India'
    ]
  },
  {
    id: 'FE',
    name: 'Far East',
    description: 'Asia-Pacific marketplaces',
    countries: ['Japan', 'Australia', 'Singapore']
  }
];

export function RegionDialog({ isOpen, onOpenChange }: RegionDialogProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region>('EU');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceCode | null>(null);
  const [step, setStep] = useState<'region' | 'marketplace'>('region');
  const { user } = useAuth();
  const { mutateAsync, isPending } = useConnectAmazonSeller();

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setSelectedMarketplace(null);
    setStep('marketplace');
  };

  const handleBack = () => {
    setStep('region');
    setSelectedMarketplace(null);
  };

  const handleConnect = async () => {
    if (!user || !selectedMarketplace) return;

    try {
      const response = await mutateAsync({
        userId: user.uid,
        region: selectedRegion,
        marketplaceId: MARKETPLACE_IDS[selectedRegion][selectedMarketplace]
      });

      // Redirect to Amazon authorization URL
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error('Failed to connect seller account:', error);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setStep('region');
      setSelectedMarketplace(null);
    }
    onOpenChange(open);
  };

  const availableMarketplaces = (() => {
    if (!selectedRegion) return [];
    
    // Get all marketplace codes for the selected region
    const marketplaces = Object.keys(MARKETPLACE_IDS[selectedRegion]) as MarketplaceCode[];
    
    // Sort by marketplace name
    return [...marketplaces].sort((a, b) => {
      const nameA = MARKETPLACE_NAMES[a as keyof typeof MARKETPLACE_NAMES] || '';
      const nameB = MARKETPLACE_NAMES[b as keyof typeof MARKETPLACE_NAMES] || '';
      return nameA.localeCompare(nameB);
    });
  })();

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <style jsx global>{`
          .region-dialog-scroll::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }
          .region-dialog-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .region-dialog-scroll::-webkit-scrollbar-thumb {
            background-color: #4b5563;
            border-radius: 3px;
          }
          .region-dialog-scroll::-webkit-scrollbar-thumb:hover {
            background-color: #6b7280;
          }
        `}</style>
        <DialogHeader>
          <DialogTitle>
            {step === 'region' ? 'Select Your Region' : 'Select Marketplace'}
          </DialogTitle>
          <DialogDescription>
            {step === 'region' 
              ? 'Choose the region where your Amazon Seller account is registered.'
              : `Select the specific marketplace in ${marketplaceRegions.find(r => r.id === selectedRegion)?.name}.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto pr-2 region-dialog-scroll">
          {step === 'region' ? (
            // Region Selection
            marketplaceRegions.map((region) => (
              <button
                key={region.id}
                className="flex items-start gap-4 rounded-lg border p-4 hover:border-yellow-400 hover:bg-yellow-50/10 transition-colors border-gray-700 bg-gray-800"
                onClick={() => handleRegionSelect(region.id)}
              >
                <Globe2 className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-200" />
                <div className="text-left flex-1">
                  <h4 className="font-medium text-gray-100">{region.name}</h4>
                  <p className="text-sm text-gray-400 mb-2">{region.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {region.countries.map((country) => (
                      <span
                        key={country}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-gray-700 text-xs text-gray-200"
                      >
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))
          ) : (
            // Marketplace Selection
            availableMarketplaces.map((marketplaceCode) => (
              <button
                key={marketplaceCode}
                className={`flex items-start gap-4 rounded-lg border p-4 hover:border-yellow-400 hover:bg-yellow-50/10 transition-colors ${
                  selectedMarketplace === marketplaceCode
                    ? 'border-yellow-400 bg-yellow-50/20'
                    : 'border-gray-700 bg-gray-800'
                }`}
                onClick={() => setSelectedMarketplace(marketplaceCode)}
              >
                <Store className="h-5 w-5 mt-0.5 flex-shrink-0 text-gray-200" />
                <div className="text-left flex-1">
                  <h4 className="font-medium text-gray-100">{MARKETPLACE_NAMES[marketplaceCode]}</h4>
                  <p className="text-sm text-gray-400">Marketplace ID: {MARKETPLACE_IDS[selectedRegion][marketplaceCode]}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-700 text-xs text-gray-200 mt-2">
                    {marketplaceCode}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
        
        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'marketplace' && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="border-gray-600 text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
          {step === 'marketplace' && (
            <Button
              onClick={handleConnect}
              disabled={isPending || !selectedMarketplace}
              className="bg-amazon hover:bg-amazon/90 text-white"
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}