
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Apartment data structure
interface ApartmentData {
  name: string;
  bedrooms: BedroomData[];
}

interface BedroomData {
  name: string;
  beds: BedData[];
}

interface BedData {
  name: string;
  bed_type: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Prepare apartment data
    const apartmentData: ApartmentData[] = [
      {
        name: "Apartment 4.1.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: []
          },
          {
            name: "Bedroom 2",
            beds: []
          },
          {
            name: "Bedroom 3",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 4",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "TEAM Apartment 4.2.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 4",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 4.3.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 4",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 4.4.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 4",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 4.5.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 4",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.1.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.2.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.3.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.4.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.5.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.6.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.7.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 3.8.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.1.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.2.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.3.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.4.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.5.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.6.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.7.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.8.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.9.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "Apartment 2.10.",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" },
              { name: "Bed 3", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "CORE TEAM - Apartment 1",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      },
      {
        name: "CORE TEAM - Apartment 2",
        bedrooms: [
          {
            name: "Bedroom 1",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 2",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          },
          {
            name: "Bedroom 3 - Separate Entrance",
            beds: [
              { name: "Bed 1", bed_type: "Single" },
              { name: "Bed 2", bed_type: "Single" }
            ]
          }
        ]
      }
    ];

    // Fix spelling for "Apartment 3.1." and "Apartment 3.2." (fixed from "Aaprtment")
    const results = [];
    
    // Import data for each apartment
    for (const apartment of apartmentData) {
      // Insert apartment
      const { data: apartmentRecord, error: apartmentError } = await supabaseClient
        .from('apartments')
        .insert({
          name: apartment.name,
          building: "Main Building",
          floor: apartment.name.includes("4.") ? "4" : 
                 apartment.name.includes("3.") ? "3" : 
                 apartment.name.includes("2.") ? "2" : "1"
        })
        .select()
        .single();

      if (apartmentError) {
        console.error(`Error inserting apartment ${apartment.name}:`, apartmentError);
        results.push({
          apartment: apartment.name,
          status: 'error',
          message: apartmentError.message
        });
        continue;
      }

      const apartmentResult = {
        apartment: apartment.name,
        status: 'success',
        bedrooms: []
      };
      
      // Insert bedrooms for this apartment
      for (const bedroom of apartment.bedrooms) {
        const { data: bedroomRecord, error: bedroomError } = await supabaseClient
          .from('bedrooms')
          .insert({
            apartment_id: apartmentRecord.id,
            name: bedroom.name,
            description: null
          })
          .select()
          .single();
          
        if (bedroomError) {
          console.error(`Error inserting bedroom ${bedroom.name} for apartment ${apartment.name}:`, bedroomError);
          apartmentResult.bedrooms.push({
            bedroom: bedroom.name,
            status: 'error',
            message: bedroomError.message
          });
          continue;
        }
        
        const bedroomResult = {
          bedroom: bedroom.name,
          status: 'success',
          beds: []
        };

        // Insert beds for this bedroom
        for (const bed of bedroom.beds) {
          const { data: bedRecord, error: bedError } = await supabaseClient
            .from('beds')
            .insert({
              bedroom_id: bedroomRecord.id,
              name: bed.name,
              bed_type: bed.bed_type,
              description: null
            })
            .select()
            .single();
            
          if (bedError) {
            console.error(`Error inserting bed ${bed.name} for bedroom ${bedroom.name}:`, bedError);
            bedroomResult.beds.push({
              bed: bed.name,
              status: 'error',
              message: bedError.message
            });
          } else {
            bedroomResult.beds.push({
              bed: bed.name,
              status: 'success'
            });
          }
        }
        
        apartmentResult.bedrooms.push(bedroomResult);
      }
      
      results.push(apartmentResult);
    }

    return new Response(
      JSON.stringify({ 
        message: 'Import completed',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error during import:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
