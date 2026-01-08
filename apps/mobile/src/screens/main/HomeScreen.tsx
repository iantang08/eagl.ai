import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  FAB,
  ActivityIndicator,
  ProgressBar,
} from 'react-native-paper';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {launchImageLibrary} from 'react-native-image-picker';
import {RootStackParamList} from '../../navigation/types';
import {useStore} from '../../store';
import {
  getVideos,
  getPresignedUrl,
  uploadToUrl,
  createVideo,
  createAnalysisJob,
  getAnalysisJob,
  getAnalysisResult,
} from '../../api';
import {Video, AnalysisJob} from '../../types';
import {config} from '../../config';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface VideoWithAnalysis extends Video {
  latestJob?: AnalysisJob;
  thumbnailUrl?: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {currentJob, setCurrentJob} = useStore();

  const [videos, setVideos] = useState<VideoWithAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useFocusEffect(
    useCallback(() => {
      loadVideos();
    }, []),
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentJob && ['pending', 'processing'].includes(currentJob.status)) {
      interval = setInterval(pollJobStatus, 3000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentJob]);

  const loadVideos = async () => {
    try {
      const videoList = await getVideos();

      // Load analysis status for each video
      const videosWithAnalysis: VideoWithAnalysis[] = await Promise.all(
        videoList.map(async video => {
          try {
            const job = await getAnalysisJob(video.id);
            let thumbnailUrl;

            if (job.result_id) {
              const result = await getAnalysisResult(job.result_id);
              thumbnailUrl = result.thumbnail_url;
            }

            return {...video, latestJob: job, thumbnailUrl};
          } catch {
            return video;
          }
        }),
      );

      setVideos(videosWithAnalysis);
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const pollJobStatus = async () => {
    if (!currentJob) return;

    try {
      const job = await getAnalysisJob(currentJob.id);
      setCurrentJob(job);

      if (job.status === 'completed' || job.status === 'failed') {
        loadVideos();
      }
    } catch (error) {
      console.error('Error polling job status:', error);
    }
  };

  const MAX_FILE_SIZE_MB = 100;
  const MAX_DURATION_SECONDS = 30;

  const handleUpload = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri || !asset.fileName) {
        Alert.alert(
          'Video Access Error',
          'Could not access the selected video. Please try again or select a different video.',
        );
        return;
      }

      // Validate file size
      if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.alert(
          'Video Too Large',
          `Please select a video smaller than ${MAX_FILE_SIZE_MB}MB. Your video is ${Math.round(asset.fileSize / 1024 / 1024)}MB.`,
        );
        return;
      }

      // Validate duration
      if (asset.duration && asset.duration > MAX_DURATION_SECONDS) {
        Alert.alert(
          'Video Too Long',
          `Please select a video shorter than ${MAX_DURATION_SECONDS} seconds. Your video is ${Math.round(asset.duration)} seconds.\n\nTip: Trim your video to show just the swing.`,
        );
        return;
      }

      setUploading(true);
      setUploadProgress(0.05);

      // Get presigned URL
      const presign = await getPresignedUrl(
        asset.fileName,
        asset.type || 'video/mp4',
      );
      setUploadProgress(0.1);

      // Upload file with real progress tracking
      await uploadToUrl(
        presign.upload_url,
        {
          uri: asset.uri,
          type: asset.type || 'video/mp4',
        },
        progress => {
          // Upload is 10% to 85% of total progress
          setUploadProgress(0.1 + progress * 0.75);
        },
      );
      setUploadProgress(0.85);

      // Create video record
      const video = await createVideo(presign.s3_key);
      setUploadProgress(0.9);

      // Create analysis job
      const job = await createAnalysisJob(video.id);
      setCurrentJob(job);
      setUploadProgress(1);

      // Refresh list
      loadVideos();

      Alert.alert(
        'Upload Complete',
        'Your swing video is being analyzed. This usually takes about 30 seconds.',
      );
    } catch (error: any) {
      console.error('Upload error:', error);

      let errorMessage = 'Something went wrong. Please try again.';
      let errorTitle = 'Upload Failed';

      if (error.message?.includes('network')) {
        errorTitle = 'Connection Error';
        errorMessage =
          'Could not connect to the server. Please check your internet connection and try again.';
      } else if (error.response?.status === 413) {
        errorTitle = 'Video Too Large';
        errorMessage = 'The video file is too large. Please select a smaller video.';
      } else if (error.response?.status === 401) {
        errorTitle = 'Session Expired';
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoPress = (video: VideoWithAnalysis) => {
    if (video.latestJob?.result_id) {
      navigation.navigate('AnalysisDetail', {
        jobId: video.latestJob.id,
        resultId: video.latestJob.result_id,
      });
    } else if (video.latestJob) {
      setCurrentJob(video.latestJob);
    }
  };

  const renderVideo = ({item}: {item: VideoWithAnalysis}) => {
    const isProcessing =
      item.latestJob &&
      ['pending', 'processing'].includes(item.latestJob.status);
    const isCompleted = item.latestJob?.status === 'completed';
    const isFailed = item.latestJob?.status === 'failed';

    return (
      <Card style={styles.videoCard} onPress={() => handleVideoPress(item)}>
        <View style={styles.videoContent}>
          {item.thumbnailUrl ? (
            <Image source={{uri: item.thumbnailUrl}} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Text style={styles.thumbnailIcon}>🎬</Text>
            </View>
          )}

          <View style={styles.videoInfo}>
            <Text style={styles.videoDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </Text>

            {isProcessing && (
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  Analyzing... {item.latestJob?.progress}%
                </Text>
                <ProgressBar
                  progress={(item.latestJob?.progress || 0) / 100}
                  color="#2E7D32"
                  style={styles.progressBar}
                />
              </View>
            )}

            {isCompleted && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Score</Text>
                <Text style={styles.scoreValue}>
                  {/* Score will be shown in detail view */}
                  View Results →
                </Text>
              </View>
            )}

            {isFailed && (
              <Text style={styles.failedText}>
                Analysis failed: {item.latestJob?.error}
              </Text>
            )}

            {!item.latestJob && (
              <Button
                mode="outlined"
                compact
                onPress={async () => {
                  const job = await createAnalysisJob(item.id);
                  setCurrentJob(job);
                  loadVideos();
                }}>
                Analyze
              </Button>
            )}
          </View>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Swings</Text>
      </View>

      {uploading && (
        <View style={styles.uploadProgress}>
          <Text style={styles.uploadText}>
            {uploadProgress < 0.85
              ? `Uploading video... ${Math.round(uploadProgress * 100)}%`
              : uploadProgress < 1
              ? 'Creating analysis job...'
              : 'Done!'}
          </Text>
          <ProgressBar
            progress={uploadProgress}
            color="#2E7D32"
            style={styles.progressBar}
          />
        </View>
      )}

      {currentJob && ['pending', 'processing'].includes(currentJob.status) && (
        <Card style={styles.currentJobCard}>
          <Card.Content>
            <Text style={styles.currentJobTitle}>Analysis in Progress</Text>
            <Text style={styles.currentJobStatus}>
              {currentJob.status === 'pending'
                ? 'Waiting to start...'
                : `Processing... ${currentJob.progress}%`}
            </Text>
            <ProgressBar
              progress={currentJob.progress / 100}
              color="#2E7D32"
              style={styles.progressBar}
            />
          </Card.Content>
        </Card>
      )}

      <FlatList
        data={videos}
        renderItem={renderVideo}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadVideos();
            }}
            tintColor="#2E7D32"
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏌️</Text>
            <Text style={styles.emptyTitle}>No swings yet</Text>
            <Text style={styles.emptySubtitle}>
              Upload your first swing video to get started
            </Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleUpload}
        disabled={uploading}
        color="#fff"
      />
    </SafeAreaView>
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
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  uploadProgress: {
    padding: 16,
    backgroundColor: '#E8F5E9',
  },
  uploadText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  currentJobCard: {
    margin: 16,
    backgroundColor: '#E8F5E9',
  },
  currentJobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  currentJobStatus: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 80,
  },
  videoCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  videoContent: {
    flexDirection: 'row',
    padding: 12,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  thumbnailPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  videoInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  videoDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
  failedText: {
    fontSize: 14,
    color: '#D32F2F',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#2E7D32',
  },
});

export default HomeScreen;
