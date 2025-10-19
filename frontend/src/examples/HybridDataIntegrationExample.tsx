/**
 * Hybrid Data Integration Example
 * Demonstrates how to use the hybrid data system in a real application
 */

import React, { useState, useEffect } from "react";
import { Leaderboard } from "../components/Leaderboard";
import { HybridLeaderboard } from "../components/HybridLeaderboard";
import { HybridAchievementSystem } from "../components/HybridAchievementSystem";
import { HybridDataService } from "../lib/services/HybridDataService";
import { realTimeDataService } from "../lib/services/RealTimeDataService";
import { errorHandlingService } from "../lib/services/ErrorHandlingService";
import { performanceOptimizationService } from "../lib/services/PerformanceOptimizationService";

// ============================================================================
// EXAMPLE COMPONENT
// ============================================================================

export function HybridDataIntegrationExample() {
  const [userId, setUserId] = useState<string>("demo-user-123");
  const [useHybridMode, setUseHybridMode] = useState<boolean>(false);
  const [showDataQuality, setShowDataQuality] = useState<boolean>(true);
  const [enableRealTime, setEnableRealTime] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] =
    useState<string>("disconnected");
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  // Initialize services
  const hybridService = new HybridDataService();

  useEffect(() => {
    // Initialize real-time service
    const initializeRealTime = async () => {
      try {
        await realTimeDataService.initialize();
        setConnectionStatus("connected");

        // Set up real-time event handlers
        realTimeDataService.onLeaderboardUpdate((data) => {
          console.log("Real-time leaderboard update:", data);
        });

        realTimeDataService.onAchievementUnlocked((achievement) => {
          console.log("Achievement unlocked:", achievement);
        });

        realTimeDataService.onChallengeProgress((challenge) => {
          console.log("Challenge progress:", challenge);
        });
      } catch (error) {
        console.error("Failed to initialize real-time service:", error);
        setConnectionStatus("error");
      }
    };

    if (enableRealTime) {
      initializeRealTime();
    }

    // Set up performance monitoring
    const updatePerformanceMetrics = () => {
      const metrics = {
        cacheStats: performanceOptimizationService.getCacheStats(),
        averageLeaderboard:
          performanceOptimizationService.getAveragePerformance(
            "getLeaderboard"
          ),
        averageAchievements:
          performanceOptimizationService.getAveragePerformance(
            "getAchievements"
          ),
      };
      setPerformanceMetrics(metrics);
    };

    updatePerformanceMetrics();
    const interval = setInterval(updatePerformanceMetrics, 10000); // Update every 10 seconds

    return () => {
      clearInterval(interval);
      realTimeDataService.disconnect();
    };
  }, [enableRealTime]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleToggleHybridMode = () => {
    setUseHybridMode(!useHybridMode);
  };

  const handleClearCache = async () => {
    await hybridService.clearCache();
    await performanceOptimizationService.clearCache();
    console.log("Cache cleared");
  };

  const handleRefreshData = async () => {
    try {
      await hybridService.clearCache();
      // Trigger re-render by updating a state
      setUserId((prev) => prev + "");
    } catch (error) {
      console.error("Failed to refresh data:", error);
    }
  };

  const handleSimulateError = async () => {
    try {
      // Simulate an error to test error handling
      await errorHandlingService.handleError(
        new Error("Simulated network error"),
        {
          component: "HybridDataIntegrationExample",
          operation: "simulateError",
          userId: userId,
        }
      );
    } catch (error) {
      console.error("Error simulation failed:", error);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hybrid Data Integration Example
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            This example demonstrates the hybrid data system that seamlessly
            combines mock and real-time user data for a rich, competitive
            experience.
          </p>

          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Controls
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hybrid-mode"
                  checked={useHybridMode}
                  onChange={handleToggleHybridMode}
                  className="mr-2"
                />
                <label
                  htmlFor="hybrid-mode"
                  className="text-sm font-medium text-gray-700"
                >
                  Hybrid Mode
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="data-quality"
                  checked={showDataQuality}
                  onChange={(e) => setShowDataQuality(e.target.checked)}
                  className="mr-2"
                />
                <label
                  htmlFor="data-quality"
                  className="text-sm font-medium text-gray-700"
                >
                  Show Data Quality
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="real-time"
                  checked={enableRealTime}
                  onChange={(e) => setEnableRealTime(e.target.checked)}
                  className="mr-2"
                />
                <label
                  htmlFor="real-time"
                  className="text-sm font-medium text-gray-700"
                >
                  Real-time Updates
                </label>
              </div>

              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  User ID:
                </span>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRefreshData}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Refresh Data
              </button>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
              >
                Clear Cache
              </button>
              <button
                onClick={handleSimulateError}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Simulate Error
              </button>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "error"
                      ? "bg-red-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">
                  Real-time: {connectionStatus}
                </span>
              </div>

              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${
                    useHybridMode ? "bg-blue-500" : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm text-gray-700">
                  Mode: {useHybridMode ? "Hybrid" : "Mock Only"}
                </span>
              </div>

              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                <span className="text-sm text-gray-700">Cache: Active</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Performance Metrics
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Cache Stats
                  </h3>
                  <div className="text-sm text-blue-700">
                    <div>
                      Size: {performanceMetrics.cacheStats.size}/
                      {performanceMetrics.cacheStats.maxSize}
                    </div>
                    <div>
                      Hit Rate:{" "}
                      {(performanceMetrics.cacheStats.hitRate * 100).toFixed(1)}
                      %
                    </div>
                    <div>
                      Total Size:{" "}
                      {(performanceMetrics.cacheStats.totalSize / 1024).toFixed(
                        1
                      )}{" "}
                      KB
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">
                    Leaderboard
                  </h3>
                  <div className="text-sm text-green-700">
                    <div>
                      Avg Duration:{" "}
                      {performanceMetrics.averageLeaderboard.averageDuration.toFixed(
                        1
                      )}
                      ms
                    </div>
                    <div>
                      Total Calls:{" "}
                      {performanceMetrics.averageLeaderboard.totalCalls}
                    </div>
                    <div>
                      Cache Hit Rate:{" "}
                      {(
                        performanceMetrics.averageLeaderboard.cacheHitRate * 100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2">
                    Achievements
                  </h3>
                  <div className="text-sm text-purple-700">
                    <div>
                      Avg Duration:{" "}
                      {performanceMetrics.averageAchievements.averageDuration.toFixed(
                        1
                      )}
                      ms
                    </div>
                    <div>
                      Total Calls:{" "}
                      {performanceMetrics.averageAchievements.totalCalls}
                    </div>
                    <div>
                      Cache Hit Rate:{" "}
                      {(
                        performanceMetrics.averageAchievements.cacheHitRate *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Leaderboard
            </h2>

            {useHybridMode ? (
              <HybridLeaderboard
                timePeriod="7d"
                limit={10}
                currentUserId={userId}
                enableRealTimeUpdates={enableRealTime}
                showDataQuality={showDataQuality}
              />
            ) : (
              <Leaderboard
                timePeriod="7d"
                limit={10}
                currentUserId={userId}
                useHybridData={false}
                showDataQuality={showDataQuality}
              />
            )}
          </div>

          {/* Achievements */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Achievements
            </h2>

            <HybridAchievementSystem
              userId={userId}
              useHybridData={useHybridMode}
              showDataQuality={showDataQuality}
              enableRealTimeUpdates={enableRealTime}
              showProgressBars={true}
              showRarityIndicators={true}
            />
          </div>
        </div>

        {/* Additional Examples */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Additional Examples
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traditional Leaderboard */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Traditional Leaderboard
              </h3>
              <Leaderboard
                timePeriod="30d"
                limit={5}
                currentUserId={userId}
                useHybridData={false}
                showDataQuality={false}
              />
            </div>

            {/* Hybrid Leaderboard with Different Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hybrid Leaderboard (All Time)
              </h3>
              <HybridLeaderboard
                timePeriod="all"
                limit={5}
                currentUserId={userId}
                enableRealTimeUpdates={false}
                showDataQuality={true}
              />
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Code Examples
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Basic Usage</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`// Traditional leaderboard (existing behavior)
<Leaderboard 
  timePeriod="7d" 
  limit={10} 
  currentUserId="user-123" 
/>

// Hybrid leaderboard (new functionality)
<Leaderboard 
  timePeriod="7d" 
  limit={10} 
  currentUserId="user-123"
  useHybridData={true}
  showDataQuality={true}
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">
                Advanced Configuration
              </h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                {`// Custom hybrid service
const hybridService = new HybridDataService(
  realTimeService,
  logger,
  {
    enableRealTimeData: true,
    enableMockData: true,
    mockDataWeight: 0.6,
    realDataWeight: 0.4,
    fallbackToMock: true,
    cacheTimeout: 30000
  }
);

// Use in component
<HybridLeaderboard 
  timePeriod="7d"
  limit={20}
  currentUserId="user-123"
  enableRealTimeUpdates={true}
  showDataQuality={true}
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default HybridDataIntegrationExample;
