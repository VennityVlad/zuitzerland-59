
// Somewhere in the Events.tsx file where the canEditEvent function is defined:

const canEditEvent = (event: EventWithProfile) => {
  if (isAdminUser) return true;
  if (event.profiles?.id === profileId) return true;
  
  // Check if user is a co-host
  const eventCoHosts = coHosts[event.id] || [];
  if (eventCoHosts.some(host => host.id === profileId)) return true;
  
  return false;
};
