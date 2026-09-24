from datetime import datetime
from app.database.database import get_connection, get_mongo_collection
from app.models.job_status import JobStatus
from app.utils.logger import logger


class JobRepository:

    @staticmethod
    def create_job(job_id: str, filename: str):
        created_at = datetime.now().isoformat()
        job_doc = {
            "id": job_id,
            "filename": filename,
            "status": JobStatus.UPLOADED.value,
            "progress": 0,
            "language": None,
            "duration": None,
            "created_at": created_at,
            "completed_at": None,
            "pdf_path": None,
            "txt_path": None,
            "json_path": None,
            "error": None
        }

        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.insert_one(job_doc)
            except Exception as e:
                logger.warning(f"MongoDB insert_one failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
        INSERT INTO jobs(
            id, filename, status, progress, language, duration,
            created_at, completed_at, pdf_path, txt_path, json_path, error
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, filename, JobStatus.UPLOADED.value, 0, None, None,
            created_at, None, None, None, None, None
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def get_job(job_id: str):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                doc = mongo_col.find_one({"id": job_id}, {"_id": 0})
                if doc:
                    return doc
            except Exception as e:
                logger.warning(f"MongoDB find_one failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id=?", (job_id,))
        row = cursor.fetchone()
        conn.close()
        return dict(row) if row else None

    @staticmethod
    def get_all_jobs():
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                docs = list(mongo_col.find({}, {"_id": 0}).sort("created_at", -1))
                if docs:
                    return docs
            except Exception as e:
                logger.warning(f"MongoDB get_all_jobs failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs ORDER BY created_at DESC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]

    @staticmethod
    def update_progress(job_id, progress, status):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one(
                    {"id": job_id},
                    {"$set": {"progress": progress, "status": status}}
                )
            except Exception as e:
                logger.warning(f"MongoDB update_progress failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE jobs SET progress=?, status=? WHERE id=?", (progress, status, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def complete_job(job_id, language, duration, pdf_path, txt_path, json_path):
        completed_at = datetime.now().isoformat()
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one(
                    {"id": job_id},
                    {"$set": {
                        "status": JobStatus.COMPLETED.value,
                        "progress": 100,
                        "language": language,
                        "duration": duration,
                        "completed_at": completed_at,
                        "pdf_path": pdf_path,
                        "txt_path": txt_path,
                        "json_path": json_path,
                        "error": None
                    }}
                )
            except Exception as e:
                logger.warning(f"MongoDB complete_job failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs
            SET status=?, progress=?, language=?, duration=?, completed_at=?,
                pdf_path=?, txt_path=?, json_path=?, error=NULL
            WHERE id=?
        """, (
            JobStatus.COMPLETED.value, 100, language, duration, completed_at,
            pdf_path, txt_path, json_path, job_id
        ))
        conn.commit()
        conn.close()

    @staticmethod
    def fail_job(job_id, error):
        completed_at = datetime.now().isoformat()
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one(
                    {"id": job_id},
                    {"$set": {
                        "status": JobStatus.FAILED.value,
                        "error": error,
                        "completed_at": completed_at
                    }}
                )
            except Exception as e:
                logger.warning(f"MongoDB fail_job failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs
            SET status=?, error=?, completed_at=?
            WHERE id=?
        """, (JobStatus.FAILED.value, error, completed_at, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def delete_job(job_id):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.delete_one({"id": job_id})
            except Exception as e:
                logger.warning(f"MongoDB delete_job failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM jobs WHERE id=?", (job_id,))
        conn.commit()
        conn.close()

    @staticmethod
    def update_status(job_id, status):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one({"id": job_id}, {"$set": {"status": status}})
            except Exception as e:
                logger.warning(f"MongoDB update_status failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE jobs SET status=? WHERE id=?", (status, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def update_duration(job_id, duration):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one({"id": job_id}, {"$set": {"duration": duration}})
            except Exception as e:
                logger.warning(f"MongoDB update_duration failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE jobs SET duration=? WHERE id=?", (duration, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def update_language(job_id, language):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one({"id": job_id}, {"$set": {"language": language}})
            except Exception as e:
                logger.warning(f"MongoDB update_language failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE jobs SET language=? WHERE id=?", (language, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def update_transcript_file(job_id, transcript_file):
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.update_one({"id": job_id}, {"$set": {"json_path": transcript_file}})
            except Exception as e:
                logger.warning(f"MongoDB update_transcript_file failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE jobs SET json_path=? WHERE id=?", (transcript_file, job_id))
        conn.commit()
        conn.close()

    @staticmethod
    def clear_jobs():
        mongo_col = get_mongo_collection()
        if mongo_col is not None:
            try:
                mongo_col.delete_many({})
            except Exception as e:
                logger.warning(f"MongoDB clear_jobs failed: {e}")

        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM jobs")
        conn.commit()
        conn.close()