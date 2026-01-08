import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView, Image, Dimensions} from 'react-native';
import {Text, Card, ProgressBar, ActivityIndicator} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useRoute} from '@react-navigation/native';
import Video from 'react-native-video';
import {RootStackParamList} from '../../navigation/types';
import {getAnalysisResult, fetchAnalysisResults, getVideo} from '../../api';
import {AnalysisResult, AnalysisResults, Video as VideoType} from '../../types';

type RouteProps = RouteProp<RootStackParamList, 'AnalysisDetail'>;

const {width: screenWidth} = Dimensions.get('window');

const AnalysisDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const {resultId} = route.params;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [details, setDetails] = useState<AnalysisResults | null>(null);
  const [video, setVideo] = useState<VideoType | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    loadResult();
  }, [resultId]);

  const loadResult = async () => {
    if (!resultId) {
      setLoading(false);
      return;
    }

    try {
      const resultData = await getAnalysisResult(resultId);
      setResult(resultData);

      // Fetch detailed results JSON
      const detailsData = await fetchAnalysisResults(resultData.results_json_url);
      setDetails(detailsData);
    } catch (error) {
      console.error('Error loading result:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#2E7D32';
    if (score >= 60) return '#F9A825';
    return '#D32F2F';
  };

  const formatTimestamp = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  if (!result || !details) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Could not load analysis results</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Thumbnail */}
      <Image
        source={{uri: result.thumbnail_url}}
        style={styles.thumbnail}
        resizeMode="cover"
      />

      {/* Overall Score */}
      <Card style={styles.scoreCard}>
        <Card.Content style={styles.scoreContent}>
          <Text style={styles.scoreLabel}>Overall Score</Text>
          <Text
            style={[
              styles.scoreValue,
              {color: getScoreColor(details.overall_score)},
            ]}>
            {details.overall_score}
          </Text>
          <Text style={styles.scoreMax}>/100</Text>
        </Card.Content>
        <View style={styles.confidenceRow}>
          <Text style={styles.confidenceLabel}>Analysis Confidence</Text>
          <Text style={styles.confidenceValue}>
            {Math.round(details.analysis_confidence * 100)}%
          </Text>
        </View>
      </Card>

      {/* Phases */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Swing Phases</Text>
          <View style={styles.phases}>
            {details.phases.map((phase, index) => (
              <View key={index} style={styles.phaseItem}>
                <View style={styles.phaseDot} />
                <View style={styles.phaseInfo}>
                  <Text style={styles.phaseName}>
                    {phase.name.charAt(0).toUpperCase() + phase.name.slice(1)}
                  </Text>
                  <Text style={styles.phaseTime}>
                    {formatTimestamp(phase.timestamp_ms)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      {/* Rubric */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Detailed Analysis</Text>
          {details.rubric.map((item, index) => (
            <View key={index} style={styles.rubricItem}>
              <View style={styles.rubricHeader}>
                <Text style={styles.rubricName}>{item.name}</Text>
                <Text
                  style={[
                    styles.rubricScore,
                    {color: getScoreColor(item.score)},
                  ]}>
                  {item.score}/{item.max_score}
                </Text>
              </View>
              <ProgressBar
                progress={item.score / item.max_score}
                color={getScoreColor(item.score)}
                style={styles.rubricProgress}
              />
              <Text style={styles.rubricExplanation}>{item.explanation}</Text>
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Metrics */}
      <Card style={[styles.card, styles.lastCard]}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Analysis Details</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {details.metrics.frames_analyzed}
              </Text>
              <Text style={styles.metricLabel}>Frames Analyzed</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {Math.round(
                  (details.metrics.valid_pose_frames /
                    details.metrics.frames_analyzed) *
                    100,
                )}
                %
              </Text>
              <Text style={styles.metricLabel}>Pose Detection Rate</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {(details.metrics.video_duration_ms / 1000).toFixed(1)}s
              </Text>
              <Text style={styles.metricLabel}>Video Duration</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{details.criteria_version}</Text>
              <Text style={styles.metricLabel}>Analysis Version</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  thumbnail: {
    width: screenWidth,
    height: screenWidth * 0.6,
    backgroundColor: '#E0E0E0',
  },
  scoreCard: {
    margin: 16,
    marginTop: -40,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  scoreMax: {
    fontSize: 24,
    color: '#999',
    marginLeft: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  lastCard: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  phases: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  phaseItem: {
    alignItems: 'center',
    flex: 1,
  },
  phaseDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    marginBottom: 8,
  },
  phaseInfo: {
    alignItems: 'center',
  },
  phaseName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  phaseTime: {
    fontSize: 12,
    color: '#666',
  },
  rubricItem: {
    marginBottom: 20,
  },
  rubricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rubricName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rubricScore: {
    fontSize: 16,
    fontWeight: '600',
  },
  rubricProgress: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  rubricExplanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default AnalysisDetailScreen;
