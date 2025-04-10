
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Bike, Train, PlaneTakeoff } from "lucide-react";

const TransportationGuide = () => {
  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="Transportation Guide" 
        description="Information about getting to and around Zuitzerland"
      />
      
      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-4xl mx-auto">
          <Tabs defaultValue="getting-there" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="getting-there" className="flex items-center gap-2">
                <PlaneTakeoff className="h-4 w-4" />
                Getting There
              </TabsTrigger>
              <TabsTrigger value="local-transport" className="flex items-center gap-2">
                <Train className="h-4 w-4" />
                Local Transport
              </TabsTrigger>
              <TabsTrigger value="parking" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                Parking & Facilities
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="getting-there" className="space-y-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-semibold">How do I get to the venue?</h2>
                  
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xl font-medium mb-3">From Zürich Airport (ZRH):</h3>
                      
                      <div className="space-y-4 pl-4">
                        <div>
                          <h4 className="font-semibold">1. LAAX Airport Shuttle:</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Direct shuttle from Zürich Airport to Laax.</li>
                            <li>Operates on weekends. Reservations required at least 48 hours in advance.</li>
                            <li>Online reservations available.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">2. Train and Bus Combination:</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Train: From Zürich Airport to Chur (approximately 1 hour and 15 minutes).</li>
                            <li>Bus: Transfer to PostBus line 81 towards Flims Laax. The ride to Laax Bergbahnen station is about 40 minutes.</li>
                            <li>Purchase combined tickets through the Swiss Federal Railways (SBB) website or app.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">3. Car Rental:</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Drive via the A3/A13 motorway towards Chur.</li>
                            <li>Take exit 18 at Reichenau, then follow Route 19 to Laax.</li>
                            <li>The drive is approximately 1 hour and 45 minutes.</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-medium mb-3">From Zürich Central Train Station:</h3>
                      
                      <div className="space-y-4 pl-4">
                        <div>
                          <h4 className="font-semibold">Train and Bus Combination:</h4>
                          <ul className="list-disc pl-6 space-y-1">
                            <li>Train: Board a train from Zürich Hauptbahnhof to Chur (approximately 1 hour).</li>
                            <li>Bus: Switch to PostBus line 81 towards Flims Laax.</li>
                            <li>Alight at Laax Bergbahnen station, located adjacent to Rocksresort.</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-medium mb-3">From Other Entry Points:</h3>
                      
                      <div className="space-y-4 pl-4">
                        <div>
                          <h4 className="font-semibold">From Basel:</h4>
                          <ul className="list-disc pl-6">
                            <li>By Car: Follow the A3/A13 motorway towards Chur. Exit at Reichenau (exit 18), then proceed on Route 19 to Laax.</li>
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold">From Other Swiss Cities:</h4>
                          <ul className="list-disc pl-6">
                            <li>Train to Chur: Utilize Switzerland's extensive train network.</li>
                            <li>Bus to Laax: From Chur, take PostBus line 81 to Laax Bergbahnen station.</li>
                          </ul>
                        </div>
                      </div>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="local-transport" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Getting Around</h2>
                  
                  <div className="space-y-6">
                    <section>
                      <div className="flex items-start gap-3">
                        <Bike className="h-6 w-6 text-primary mt-0.5" />
                        <div>
                          <h3 className="text-lg font-medium">E-Bikes Available</h3>
                          <p className="text-gray-600">E-Bikes are available to rent during your stay.</p>
                        </div>
                      </div>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-medium mb-3">Additional Tips:</h3>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>
                          <span className="font-medium">Luggage Transport:</span> SBB offers a service to transport luggage from any address in Switzerland directly to your accommodation.
                        </li>
                        <li>
                          <span className="font-medium">Local Transportation:</span> The area is well-served by local buses and shuttles, facilitating easy movement around the resort and nearby attractions.
                        </li>
                        <li>
                          <span className="font-medium">Advance Bookings:</span> For services like the LAAX Airport Shuttle, ensure reservations are made at least 48 hours prior to travel.
                        </li>
                      </ul>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="parking" className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">Parking Information</h2>
                  
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-xl font-medium">Is there parking?</h3>
                      <p className="mt-2">Yes, but at a cost.</p>
                    </section>
                    
                    <section>
                      <h3 className="text-xl font-medium">Facilities</h3>
                      <p className="mt-2">Rocksresort offers parking facilities, including over 30 charging stations for electric vehicles.</p>
                    </section>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TransportationGuide;
