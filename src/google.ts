export const directionsRenderer = new google.maps.DirectionsRenderer();

const distanceMatrixService = new google.maps.DistanceMatrixService();
const directionsService = new google.maps.DirectionsService();

export const resolveAddresses = async (addresses: string[]) => {
  const resultsMap: Record<string, string> = {};

  const unknowns: string[] = [];
  for (const address of addresses) {
    if (localStorage.getItem(`address:${address}`)) {
      resultsMap[address] = JSON.parse(
        localStorage.getItem(`address:${address}`) || ''
      );
    } else {
      unknowns.push(address);
    }
  }
  if (unknowns.length) {
    const response = await distanceMatrixService.getDistanceMatrix({
      origins: ['7 N Madison Ave, Spring Valley, NY 10977, USA'],
      destinations: [...new Set(unknowns)].map(
        (u) => `${u}, Rockland County, NY, USA`
      ),
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.IMPERIAL,
      region: 'us',
    });
    response.destinationAddresses.map((address, index) => {
      const unknown = unknowns[index];
      localStorage.setItem(`address:${unknown}`, JSON.stringify(address));
      resultsMap[unknown] = address;
    });
  }
  return [...new Set(addresses.map((address) => resultsMap[address]))];
};

interface CalculateRouteParams {
  start: string;
  end: string;
  waypoints: string[];
  targetTime: Date;
}
export const calculateAndDisplayRoute = async ({
  start,
  end,
  waypoints,
  targetTime,
}: CalculateRouteParams) => {
  const [startAddress, endAddress, ...waypointAddresses] =
    await resolveAddresses([start, end, ...waypoints]);
  const directions = await directionsService.route({
    origin: startAddress,
    destination: endAddress,
    waypoints: waypointAddresses.map((waypoint) => ({ location: waypoint })),
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode.DRIVING,
    transitOptions: {
      arrivalTime: targetTime,
    },
  });

  directionsRenderer.setDirections(directions);
  let totalTime = 0;
  let totalDistance = 0;
  const instructions = directions.routes[0].legs.flatMap((leg) =>
    leg.steps
      .flatMap((step) => {
        totalTime += step.duration?.value || 0;
        totalDistance += step.distance?.value || 0;
        return `<span style="width:10px;display:inline-block"></span>For ${
          step.distance?.text
        } (${step.duration?.text}) ${step.instructions.replace(
          /<div/g,
          ' <span'
        )}`;
      })
      .concat(`STOP - ${leg.end_address}`)
  );
  instructions.pop();
  instructions.unshift(`START - ${startAddress}`);

  console.log(directions);
  return { instructions, totalTime, totalDistance };
};
