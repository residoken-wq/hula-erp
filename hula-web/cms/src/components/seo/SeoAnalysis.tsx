import React, { useEffect, useState } from 'react';
import { Card, Progress, List, Tag, Collapse } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, WarningOutlined } from '@ant-design/icons';

interface SeoAnalysisProps {
    content: string;
    keyword: string;
    title: string;
    description: string;
    slug: string;
    onScoreChange?: (score: number) => void;
}

interface TestResult {
    passed: boolean; // boolean
    message: string;
    type: 'critical' | 'recommended' | 'good';
}

export const SeoAnalysis: React.FC<SeoAnalysisProps> = ({ content, keyword, title, description, slug, onScoreChange }) => {
    const [score, setScore] = useState(0);
    const [tests, setTests] = useState<TestResult[]>([]);

    useEffect(() => {
        analyze();
    }, [content, keyword, title, description, slug]);

    const analyze = () => {
        const results: TestResult[] = [];
        let points = 0;
        let totalPoints = 0;

        // Helper to add test
        const addTest = (condition: boolean, passMsg: string, failMsg: string, weight: number, type: 'critical' | 'recommended' = 'recommended') => {
            totalPoints += weight;
            if (condition) {
                points += weight;
                results.push({ passed: true, message: passMsg, type: 'good' });
            } else {
                results.push({ passed: false, message: failMsg, type });
            }
        };

        const lowerKeyword = keyword?.toLowerCase().trim();
        const hasKeyword = !!lowerKeyword;

        // 1. Keyword Existence Tests
        addTest(hasKeyword, 'Từ khóa tập trung đã được thiết lập.', 'Chưa thiết lập từ khóa tập trung.', 10, 'critical');

        if (hasKeyword) {
            // 2. Keyword in Title
            addTest(
                title?.toLowerCase().includes(lowerKeyword),
                'Từ khóa xuất hiện trong tiêu đề SEO.',
                'Từ khóa không tìm thấy trong tiêu đề SEO.',
                10, 'critical'
            );

            // 3. Keyword in Description
            addTest(
                description?.toLowerCase().includes(lowerKeyword),
                'Từ khóa xuất hiện trong meta description.',
                'Từ khóa không tìm thấy trong meta description.',
                5
            );

            // 4. Keyword in URL
            addTest(
                slug?.toLowerCase().includes(lowerKeyword.replace(/\s+/g, '-')),
                'Từ khóa xuất hiện trong URL.',
                'Từ khóa không tìm thấy trong URL.',
                5
            );

            // 5. Keyword in Content
            // Strip HTML
            const plainContent = content?.replace(/<[^>]+>/g, '').toLowerCase() || '';
            const keywordCount = (plainContent.match(new RegExp(lowerKeyword, 'g')) || []).length;

            addTest(
                keywordCount > 0,
                `Từ khóa xuất hiện ${keywordCount} lần trong nội dung.`,
                'Từ khóa không tìm thấy trong nội dung bài viết.',
                10, 'critical'
            );

            // Keyword Density (Ideal 0.5% - 2.5%)
            const wordCount = plainContent.split(/\s+/).length;
            const density = (keywordCount / wordCount) * 100;
            addTest(
                density >= 0.5 && density <= 2.5,
                `Mật độ từ khóa đạt ${density.toFixed(2)}% (Tốt).`,
                `Mật độ từ khóa là ${density.toFixed(2)}% (Khuyên dùng: 0.5% - 2.5%).`,
                5
            );
        }

        // 6. Content Length
        const wordCount = content?.replace(/<[^>]+>/g, '').split(/\s+/).length || 0;
        addTest(
            wordCount >= 600,
            `Độ dài bài viết tốt (${wordCount} từ).`,
            `Bài viết hơi ngắn (${wordCount} từ). Nên viết trên 600 từ.`,
            10
        );

        // 7. Meta Description Length
        const descLen = description?.length || 0;
        addTest(
            descLen >= 120 && descLen <= 160,
            `Độ dài Meta Description tốt (${descLen} ký tự).`,
            `Độ dài Meta Description: ${descLen} ký tự (Nên từ 120-160).`,
            5
        );

        // 8. Internal/External Links (Simple check)
        addTest(
            content?.includes('href="'),
            'Bài viết có chứa liên kết.',
            'Bài viết chưa có liên kết nào (Internal/External).',
            5
        );

        // Calculate Score
        const calculatedScore = totalPoints === 0 ? 0 : Math.round((points / totalPoints) * 100);
        setScore(calculatedScore);
        setTests(results);

        if (onScoreChange) {
            onScoreChange(calculatedScore);
        }
    };

    const getColor = () => {
        if (score >= 80) return '#52c41a';
        if (score >= 50) return '#faad14';
        return '#ff4d4f';
    };

    return (
        <Card title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Content Analysis</span>
                <Tag color={getColor()} style={{ fontSize: 16, padding: '4px 10px' }}>{score}/100</Tag>
            </div>
        } size="small">
            <div style={{ marginBottom: 16 }}>
                <Progress percent={score} strokeColor={getColor()} showInfo={false} />
            </div>

            <Collapse ghost defaultActiveKey={['problems', 'improvements', 'good']}>
                <Collapse.Panel header="Vấn đề quan trọng" key="problems">
                    <List
                        size="small"
                        dataSource={tests.filter(t => !t.passed && t.type === 'critical')}
                        renderItem={item => (
                            <List.Item>
                                <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                                {item.message}
                            </List.Item>
                        )}
                        locale={{ emptyText: 'Không có lỗi nghiêm trọng' }}
                    />
                </Collapse.Panel>

                <Collapse.Panel header="Cần cải thiện" key="improvements">
                    <List
                        size="small"
                        dataSource={tests.filter(t => !t.passed && t.type !== 'critical')}
                        renderItem={item => (
                            <List.Item>
                                <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
                                {item.message}
                            </List.Item>
                        )}
                        locale={{ emptyText: 'Làm tốt lắm!' }}
                    />
                </Collapse.Panel>

                <Collapse.Panel header="Đã đạt chuẩn" key="good">
                    <List
                        size="small"
                        dataSource={tests.filter(t => t.passed)}
                        renderItem={item => (
                            <List.Item>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                {item.message}
                            </List.Item>
                        )}
                    />
                </Collapse.Panel>
            </Collapse>
        </Card>
    );
};
