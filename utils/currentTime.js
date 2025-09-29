function getCurrentTime() {
  // Create a new Date object, which represents the current date and time
  const now = new Date();

  // Get the current hour (0-23)
  const hours = now.getHours();

  // Get the current minute (0-59)
  const minutes = now.getMinutes();

  // Get the current second (0-59)
  const seconds = now.getSeconds();

  // Format the time for display
  const currentTime = `${hours}:${minutes}:${seconds}`;

  // Print the current time to the console
  // console.log(`Current Time: ${currentTime}`);

  const currentTimeFormatted = now.toLocaleTimeString();
  // console.log(`Current Time (Formatted): ${currentTimeFormatted}`);

  return `Current Time: ${currentTime} \n ${currentTimeFormatted}`;
}

export default getCurrentTime;
