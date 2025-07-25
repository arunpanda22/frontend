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
import { Globe2 } from 'lucide-react';

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
  const { user } = useAuth();
  const { mutateAsync, isPending } = useConnectAmazonSeller();

  const handleConnect = async () => {
    if (!user) return;

    try {
      const response = await mutateAsync({
        userId: user.uid,
        region: selectedRegion
      });

      // Redirect to Amazon authorization URL
      window.location.href = response.authorization_url;
    } catch (error) {
      console.error('Failed to connect seller account:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Your Region</DialogTitle>
          <DialogDescription>
            Choose the region where your Amazon Seller account is registered.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {marketplaceRegions.map((region) => (
            <button
              key={region.id}
              className={`flex items-start gap-4 rounded-lg border p-4 hover:border-yellow-400 hover:bg-yellow-50/5 transition-colors ${
                selectedRegion === region.id
                  ? 'border-yellow-400 bg-yellow-50/10'
                  : 'border-gray-700'
              }`}
              onClick={() => setSelectedRegion(region.id)}
            >
              <Globe2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="text-left flex-1">
                <h4 className="font-medium text-gray-200">{region.name}</h4>
                <p className="text-sm text-gray-400 mb-2">{region.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {region.countries.map((country) => (
                    <span
                      key={country}
                      className="inline-flex items-center px-2 py-1 rounded-md bg-gray-800 text-xs text-gray-300"
                    >
                      {country}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConnect}
            disabled={isPending}
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 