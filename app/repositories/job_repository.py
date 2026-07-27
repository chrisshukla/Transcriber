from datetime import datetime

from app.database.database import get_connection
from app.models.job_status import JobStatus
class JobRepository:

    @staticmethod
    def create_job(job_id: str, filename: str):

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
        INSERT INTO jobs(
            id,
            filename,
            status,
            progress,
            language,
            duration,
            created_at,
            completed_at,
            pdf_path,
            txt_path,
            json_path,
            error
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id,
            filename,
            JobStatus.UPLOADED.value,
            0,
            None,
            None,
            datetime.now().isoformat(),
            None,
            None,
            None,
            None,
            None
        ))

        conn.commit()
        conn.close()
    
    @staticmethod
    def get_job(job_id: str):

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM jobs WHERE id=?",
            (job_id,)
        )

        row = cursor.fetchone()

        conn.close()

        return dict(row) if row else None
    
    @staticmethod
    def get_all_jobs():

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute("""
            SELECT *
            FROM jobs
            ORDER BY created_at DESC
        """)

        rows = cursor.fetchall()

        conn.close()

        return [dict(row) for row in rows]
    
    @staticmethod
    def update_progress(job_id, progress, status):

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET
                progress=?,
                status=?
            WHERE id=?
        """, (
            progress,
            status,
            job_id
        ))

        conn.commit()
        conn.close()
        
    @staticmethod
    def complete_job(
        job_id,
        language,
        duration,
        pdf_path,
        txt_path,
        json_path
    ):

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET

                status=?,
                progress=?,
                language=?,
                duration=?,
                completed_at=?,
                pdf_path=?,
                txt_path=?,
                json_path=?,
                error=NULL
                

            WHERE id=?
        """, (

            JobStatus.COMPLETED.value,
            100,
            language,
            duration,
            datetime.now().isoformat(),
            pdf_path,
            txt_path,
            json_path,
            job_id

        ))

        conn.commit()
        conn.close()
    
    @staticmethod
    def fail_job(job_id, error):

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET
                status=?,
                error=?,
                completed_at=?
            WHERE id=?
        """, (
            JobStatus.FAILED.value,
            error,
            datetime.now().isoformat(),
            job_id
        ))

        conn.commit()
        conn.close()
    @staticmethod
    def delete_job(job_id):

        conn = get_connection()

        cursor = conn.cursor()

        cursor.execute(
            "DELETE FROM jobs WHERE id=?",
            (job_id,)
        )

        conn.commit()
        conn.close()
    @staticmethod
    def update_status(job_id, status):

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET status=?
            WHERE id=?
        """, (
            status,
            job_id
        ))

        conn.commit()
        conn.close()
    
    @staticmethod
    def update_duration(job_id, duration):  

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET duration=?
            WHERE id=?
        """, (
            duration,
            job_id
        ))

        conn.commit()
        conn.close()
    @staticmethod
    def update_language(job_id, language):

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET language=?
            WHERE id=?
        """, (
            language,
            job_id
        ))

        conn.commit()
        conn.close()
        
    @staticmethod
    def update_transcript_file(job_id, transcript_file):

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE jobs
            SET json_path=?
            WHERE id=?
        """, (
            transcript_file,
            job_id
        ))

        conn.commit()
        conn.close()
        
    @staticmethod
    def clear_jobs():

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM jobs")

        conn.commit()
        conn.close()