
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DisplayCode } from '@/hooks/useDisplayCode';
import CreateDisplayCode from './CreateDisplayCode';
import DisplayCodeList from './DisplayCodeList';

type DisplayCodeSectionProps = {
  displayCodes: DisplayCode[];
  locations: any[];
  eventTags: any[];
  onDisplayCodesChange: () => void;
};

export const DisplayCodeSection = ({ 
  displayCodes, 
  locations, 
  eventTags, 
  onDisplayCodesChange 
}: DisplayCodeSectionProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>TV Display Mode</CardTitle>
        <CardDescription>
          Generate access codes for the public schedule display screens
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Access Control</AlertTitle>
          <AlertDescription>
            Generated codes provide access to view the schedule on public displays without requiring a login.
            Each code can be configured to show specific content and expires automatically.
          </AlertDescription>
        </Alert>
        
        <CreateDisplayCode
          locations={locations}
          eventTags={eventTags}
          onCodeCreated={onDisplayCodesChange}
        />
        
        <DisplayCodeList
          displayCodes={displayCodes}
          locations={locations}
          eventTags={eventTags}
          onCodesChange={onDisplayCodesChange}
        />
      </CardContent>
    </Card>
  );
};
