import React from 'react';
import { motion } from 'framer-motion';

export function AIInsights({ insights, loading }) {
    if (!insights && !loading) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 100 }
        }
    };

    if (loading) {
        return (
            <div className="ai-summary-card skeleton-ai">
                <div className="ai-icon-pulse"><i className="fas fa-brain"></i></div>
                <div className="ai-text-skeleton">
                    <div className="skeleton-line-long"></div>
                    <div className="skeleton-line-short"></div>
                </div>
            </div>
        );
    }

    return (
        <motion.section 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="suggestions-section premium-ai-view"
        >
            <div className="section-header">
                <h2><i className="fas fa-wand-sparkles"></i> AI Smart Insights</h2>
            </div>
            
            <motion.div variants={itemVariants} className="ai-main-card">
                <div className="ai-glow-bg"></div>
                <div className="card-inner">
                    <div className="ai-main-icon">
                        <i className="fas fa-brain-circuit"></i>
                    </div>
                    <div className="ai-main-content">
                        <h3>Today's Cloud Perspective</h3>
                        <p>{insights.summary}</p>
                    </div>
                </div>
            </motion.div>

            <div className="suggestions-grid">
                <motion.div variants={itemVariants} className="suggestion-card-premium activity">
                    <div className="card-icon-wrapper">
                        <i className="fas fa-person-running"></i>
                    </div>
                    <div className="suggestion-details">
                        <h4>Activity Tip</h4>
                        <p>{insights.activities}</p>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="suggestion-card-premium men">
                    <div className="card-icon-wrapper">
                        <i className="fas fa-mars"></i>
                    </div>
                    <div className="suggestion-details">
                        <h4>For Men</h4>
                        <p>{insights.men}</p>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="suggestion-card-premium women">
                    <div className="card-icon-wrapper">
                        <i className="fas fa-venus"></i>
                    </div>
                    <div className="suggestion-details">
                        <h4>For Women</h4>
                        <p>{insights.women}</p>
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}
