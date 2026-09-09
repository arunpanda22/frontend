import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Globe2, 
  Building2, 
  Store,
  Tag,
  Check,
  Clock,
  DollarSign,
  Info
} from 'lucide-react';

interface AccountInfo {
  marketplaceStringId: string;
  id: string;
  type: string;
  name: string;
  validPaymentMethod: boolean;
}

interface Profile {
  profileId: number;
  countryCode: string;
  currencyCode: string;
  dailyBudget: number;
  timezone: string;
  accountInfo: AccountInfo;
}

interface ProfileSelectorProps {
  profiles: Profile[];
  onProfileSelect: (profileId: string) => void;
  isLoading: boolean;
}

export function ProfileSelector({ profiles, onProfileSelect, isLoading }: ProfileSelectorProps) {
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const router = useRouter();

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleProfileSelect = () => {
    if (selectedProfileId) {
      onProfileSelect(selectedProfileId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Select Advertising Profile</h3>
        <ScrollArea className="h-[500px] rounded-md border">
          <div className="p-4">
            <Tooltip.Provider delayDuration={300}>
              <RadioGroup.Root
                value={selectedProfileId}
                onValueChange={setSelectedProfileId}
                className="space-y-4"
              >
                {profiles.map((profile) => (
                  <div
                    key={profile.profileId}
                    className={`flex items-center space-x-4 rounded-lg border p-4 ${
                      selectedProfileId === profile.profileId.toString()
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <RadioGroup.Item 
                      value={profile.profileId.toString()} 
                      id={profile.profileId.toString()}
                      className="h-5 w-5 rounded-full border border-gray-300 data-[state=checked]:border-yellow-400 data-[state=checked]:bg-yellow-400"
                    >
                      <RadioGroup.Indicator className="flex h-full w-full items-center justify-center after:block after:h-2.5 after:w-2.5 after:rounded-full after:bg-white" />
                    </RadioGroup.Item>
                    <Label
                      htmlFor={profile.profileId.toString()}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                {profile.accountInfo.name}
                              </p>
                              {profile.accountInfo.validPaymentMethod && (
                                <Badge variant="success" className="flex items-center gap-1">
                                  <Check className="h-3 w-3" />
                                  Valid Payment
                                </Badge>
                              )}
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <button className="inline-flex items-center justify-center rounded-full p-1 text-gray-400 hover:text-gray-500">
                                    <Info className="h-4 w-4" />
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Portal>
                                  <Tooltip.Content
                                    className="max-w-xs rounded-md bg-white px-4 py-3 shadow-lg border border-gray-200"
                                    sideOffset={5}
                                  >
                                    <div className="space-y-2 text-sm">
                                      <p><span className="font-medium">Account ID:</span> {profile.accountInfo.id}</p>
                                      <p><span className="font-medium">Marketplace:</span> {profile.accountInfo.marketplaceStringId}</p>
                                      <p><span className="font-medium">Type:</span> {profile.accountInfo.type}</p>
                                      <p><span className="font-medium">Country:</span> {profile.countryCode}</p>
                                      <p><span className="font-medium">Currency:</span> {profile.currencyCode}</p>
                                      <p><span className="font-medium">Timezone:</span> {profile.timezone}</p>
                                      {profile.accountInfo.validPaymentMethod && profile.dailyBudget && (
                                        <p><span className="font-medium">Daily Budget:</span> {formatCurrency(profile.dailyBudget, profile.currencyCode)}</p>
                                      )}
                                    </div>
                                    <Tooltip.Arrow className="fill-white" />
                                  </Tooltip.Content>
                                </Tooltip.Portal>
                              </Tooltip.Root>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Tag className="h-3.5 w-3.5" />
                                {profile.profileId}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Store className="h-3.5 w-3.5" />
                                {profile.accountInfo.marketplaceStringId}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Type:</span>{' '}
                            <span className="capitalize">{profile.accountInfo.type}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Globe2 className="h-4 w-4 text-gray-400" />
                            <span className="font-medium">Country:</span>{' '}
                            {profile.countryCode}
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup.Root>
            </Tooltip.Provider>
          </div>
        </ScrollArea>
      </div>

      <Button
        onClick={handleProfileSelect}
        disabled={!selectedProfileId || isLoading}
        className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-medium"
      >
        {isLoading ? (
          <>
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            Selecting Profile...
          </>
        ) : (
          'Continue with Selected Profile'
        )}
      </Button>

      {/* Commented out Skip button
      <Button
        onClick={() => router.push('/maindashboard')}
        variant="outline"
        className="w-full mt-2"
      >
        Skip for Now
      </Button>
      */}
    </div>
  );
} 