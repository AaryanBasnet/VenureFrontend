// Windows ignores a TZ given on the command line when a process starts; assigning it again inside the
// process applies it. `npm run test:unit:tz` relies on this to run the suite under different host zones.
if (process.env.TZ) process.env.TZ = process.env.TZ;
