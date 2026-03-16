import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { agentApi } from '../lib/agent';

const LOCATION_TASK_NAME = 'background-location-task';

// --- Background Task Definition ---
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
    if (error) {
        console.error('Background location task error:', error);
        return;
    }
    if (data) {
        const { locations } = data;
        if (locations && locations.length > 0) {
            const { latitude, longitude } = locations[0].coords;
            // Best-effort push to backend in background
            agentApi.updateLocation(latitude, longitude).catch(err => {
                console.error('Failed to update background location:', err);
            });
        }
    }
});

export const useAgentLocation = (isOnline: boolean) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const startForegroundTracking = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);

        // Simple foreground polling as fallback/supplement
        intervalRef.current = setInterval(async () => {
            const newLoc = await Location.getCurrentPositionAsync({});
            setLocation(newLoc);
            agentApi.updateLocation(newLoc.coords.latitude, newLoc.coords.longitude).catch(console.error);
        }, 15000); // Update every 15s
    };

    const startBackgroundTracking = async () => {
        const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
        if (fgStatus !== 'granted') return;

        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        if (bgStatus !== 'granted') {
            console.warn('Background location permission not granted');
            return;
        }

        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 50, // Update every 50 meters
            deferredUpdatesInterval: 60000, // Or every minute
            foregroundService: {
                notificationTitle: 'ServeIQ Agent is Online',
                notificationBody: 'Your location is being shared with the marketplace.',
            },
        });
    };

    const stopTracking = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (hasStarted) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
    };

    useEffect(() => {
        if (isOnline) {
            startForegroundTracking();
            startBackgroundTracking();
        } else {
            stopTracking();
        }

        return () => {
            stopTracking();
        };
    }, [isOnline]);

    return { location, errorMsg };
};
