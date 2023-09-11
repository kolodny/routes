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
}: // targetTime,
CalculateRouteParams) => {
  const [startAddress, endAddress, ...waypointAddresses] =
    await resolveAddresses([start, end, ...waypoints]);
  console.log({ startAddress, endAddress, waypointAddresses });
  const optimizedWaypoints = await directionsService.route({
    origin: startAddress,
    destination: endAddress,
    waypoints: waypointAddresses.map((waypoint) => ({ location: waypoint })),
    optimizeWaypoints: true,
    travelMode: google.maps.TravelMode.DRIVING,
  });
  const optimized = optimizedWaypoints.routes[0].waypoint_order.map((index) => {
    return waypointAddresses[index];
  });
  console.log(optimized);
  const directions = await directionsService.route({
    origin: startAddress,
    destination: endAddress,
    waypoints: optimized.map((waypoint) => ({
      location: waypoint,
      stopover: false,
    })),
    travelMode: google.maps.TravelMode.DRIVING,
    // drivingOptions: {
    //   trafficModel: google.maps.TrafficModel.BEST_GUESS,
    //   departureTime: targetTime,
    // },
    // transitOptions: {
    //   arrivalTime: targetTime,
    // },
  });

  const originalDirections = await directionsService.route({
    origin: startAddress,
    destination: endAddress,
    waypoints: waypointAddresses.map((waypoint) => ({
      location: waypoint,
      stopover: false,
    })),
    travelMode: google.maps.TravelMode.DRIVING,
    // drivingOptions: {
    //   trafficModel: google.maps.TrafficModel.BEST_GUESS,
    //   departureTime: targetTime,
    // },
    // transitOptions: {
    //   arrivalTime: targetTime,
    // },
  });

  console.log('directions', directions);
  console.log('optimizedWaypoints', optimizedWaypoints);

  directionsRenderer.setDirections(directions);
  const route = directions.routes[0];
  let totalTime = 0;
  let totalDistance = 0;
  const instructions = route.legs.flatMap((leg) =>
    leg.steps
      .flatMap((step) => {
        totalTime += step.duration?.value || 0;
        totalDistance += step.distance?.value || 0;
        const instructions = step.instructions
          .replace(/<div/g, ' <span')
          .replace(/<\/div/g, '</span');
        return `<span style="width:10px;display:inline-block"></span>${instructions} - (${step.distance?.text}, ${step.duration?.text})`;
      })
      .concat(`STOP - ${leg.end_address}`)
  );
  instructions.unshift(`START - ${startAddress}`);
  const newOrder = optimizedWaypoints.routes[0].waypoint_order;

  (window as any).originalDirections = originalDirections;
  (window as any).optimizedWaypoints = directions;

  console.log(directions);
  return {
    instructions,
    totalTime,
    totalDistance,
    newOrder,
    optimizedWaypoints,
    originalDirections,
  };
};

export const calculateRouteInfo = (route: google.maps.DirectionsRoute) => {
  let totalTime = 0;
  let totalDistance = 0;
  const instructions = route.legs.flatMap((leg) =>
    leg.steps
      .flatMap((step) => {
        totalTime += step.duration?.value || 0;
        totalDistance += step.distance?.value || 0;
        const instructions = step.instructions
          .replace(/<div/g, ' <span')
          .replace(/<\/div/g, '</span');
        return `<span style="width:10px;display:inline-block"></span>${instructions} - (${step.distance?.text}, ${step.duration?.text})`;
      })
      .concat(`STOP - ${leg.end_address}`)
  );
  instructions.unshift(`START - ${route.legs[0].start_address}`);
  return {
    instructions,
    totalTime,
    totalDistance,
  };
};
