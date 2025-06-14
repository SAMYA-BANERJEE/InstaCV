#                                                        -------Importing Libraries-------


from flask import Flask, render_template, request, session, redirect, flash, jsonify
from google.auth.transport import requests as google_requests
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from flask_mail import Mail, Message
from google.oauth2 import id_token
from datetime import datetime
import bcrypt
import os
import secrets
import string

#                                                         ---------App Configuration---------


app = Flask(__name__)


#################################################################################################################################################                                                                       USER PANEL #################################################################################################################################################


#  --Google OAuth2 Configuration--

app.config['GOOGLE_CLIENT_ID'] = '370106510299-qb4ki4gnfqrq67eu4gogo6tuujrbr602.apps.googleusercontent.com'

#    --Database Configuration--

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload
app.config['ALLOWED_EXTENSIONS'] = {'png', 'jpg', 'jpeg', 'gif'}
db = SQLAlchemy(app)
app.secret_key = 'secret_key'

#     --Email Configuration--
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'instacvwebmail@gmail.com'  # Your Gmail address
app.config['MAIL_PASSWORD'] = 'pilk wmrq toxe pnpe'  # You'll need to use an App Password if 2FA is enabled
app.config['MAIL_DEFAULT_SENDER'] = 'instacvwebmail@gmail.com'
mail = Mail(app)



#                                                          -----------Database Models-----------


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True)
    password = db.Column(db.String(100))
    
    # Relationships
    personal_details = db.relationship('PersonalDetails', backref='user', lazy=True, uselist=False)
    educations = db.relationship('Education', backref='user', lazy=True)
    experiences = db.relationship('Experience', backref='user', lazy=True)
    skills = db.relationship('Skill', backref='user', lazy=True)
    projects = db.relationship('Project', backref='user', lazy=True)
    objective = db.relationship('Objective', backref='user', lazy=True, uselist=False)
    references = db.relationship('Reference', backref='user', lazy=True)
    saved_templates = db.relationship('SavedTemplate', backref='user', lazy=True) 

    def __init__(self, email, password, name):
        self.name = name
        self.email = email
        self.password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password.encode('utf-8'))

# New model for saved templates
class SavedTemplate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date_saved = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Unique constraint to prevent duplicate saved templates
    __table_args__ = (db.UniqueConstraint('template_id', 'user_id', name='unique_user_template'),)

class PersonalDetails(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    address = db.Column(db.Text)
    email = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    photo = db.Column(db.String(255))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Education(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    course = db.Column(db.String(100))
    school = db.Column(db.String(100))
    grade = db.Column(db.String(50))
    year = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Experience(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company = db.Column(db.String(100))
    job_title = db.Column(db.String(100))
    start_date = db.Column(db.String(50))
    end_date = db.Column(db.String(50))
    details = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Skill(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    skill_name = db.Column(db.String(100))
    skill_level = db.Column(db.Integer)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Project(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    project_title = db.Column(db.String(100))
    project_description = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Objective(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    objective_text = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Reference(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referee_name = db.Column(db.String(100))
    referee_job = db.Column(db.String(100))
    referee_company = db.Column(db.String(100))
    referee_email = db.Column(db.String(100))
    referee_phone = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

with app.app_context():
    db.create_all()

                                          
#                                                 ------------Functions and Helpers------------

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Helper function to check allowed file extensions
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

# Helper function to get current user
def get_current_user():
    if 'email' in session:
        return User.query.filter_by(email=session['email']).first()
    return None

# Helper function to send feedback email
def send_feedback_email(name, email, subject, message, rating):
    try:
        current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        msg = Message(
            subject=f"New Feedback: {subject}",
            recipients=["instacvwebmail@gmail.com"],
            body=f"""
New feedback received from {name} ({email})

Rating: {rating}/5

Subject: {subject}

Message:
{message}

Date: {current_time}
            """,
            html=f"""
<h2>New Feedback Received</h2>
<p><strong>From:</strong> {name} ({email})</p>
<p><strong>Rating:</strong> {rating}/5</p>
<p><strong>Subject:</strong> {subject}</p>
<h3>Message:</h3>
<p>{message}</p>
<p><em>Submitted on: {current_time}</em></p>
            """
        )
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {str(e)}")
        return False


#                                                            ---------Routes ---------

# index page hosting-----
@app.route('/')
def index():
    return render_template('index.html')

# handles Google authentication
@app.route('/google-login', methods=['POST'])
def google_login():
    # Get token from request
    token = request.json.get('token')
    
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            token, 
            google_requests.Request(), 
            app.config['GOOGLE_CLIENT_ID']
        )
        
        # Get user info from the token
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        # Check if user exists
        user = User.query.filter_by(email=email).first()
        
        if not user:
            # Generate a random password for the user
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for i in range(16))
            
            # Create a new user
            user = User(name=name, email=email, password=password)
            db.session.add(user)
            db.session.commit()
        
        # Log the user in
        session['name'] = user.name
        session['email'] = user.email
        session['password'] = user.password
        
        return jsonify({'success': True})
    
    except ValueError as e:
        # Invalid token
        print(f"Invalid token: {e}")
        return jsonify({'success': False, 'message': 'Invalid token'})
    
    except Exception as e:
        # Other errors
        print(f"Error during Google login: {e}")
        return jsonify({'success': False, 'message': 'Authentication failed'})

@app.route('/google-register', methods=['POST'])
def google_register():
    # This can be the same as google_login since we're handling both cases
    return google_login()


# Feedback form route
@app.route('/feedback', methods=['GET', 'POST'])
def feedback():
    if request.method == 'POST':
        name = request.form.get('name')
        email = request.form.get('email')
        subject = request.form.get('subject')
        message = request.form.get('message')
        rating = request.form.get('rating', 5)  # Default to 5 if not provided
        
        # Validate form data
        if not name or not email or not subject or not message:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'success': False, 'message': 'All fields are required'}), 400
            flash('All fields are required', 'error')
            return redirect('/feedback')
        
        # Send email notification directly without saving to database
        email_sent = send_feedback_email(name, email, subject, message, rating)
        
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return jsonify({
                'success': True, 
                'message': 'Thank you for your feedback!',
                'email_sent': email_sent
            })
        else:
            if email_sent:
                flash('Thank you for your feedback!', 'success')
            else:
                flash('There was an issue sending your feedback. Please try again later.', 'error')
            return redirect('/feedback')
    
    # GET request - display the form
    return render_template('feedback.html')

# register page hosting----
@app.route('/register', methods=['GET','POST'])
def register():
    if request.method== 'POST':
        # handle request
        name=request.form['name']
        email=request.form['email']
        password=request.form['password']
        new_user= User(name=name,email=email,password=password)
        db.session.add(new_user)
        db.session.commit()
        return redirect('/login')

    return render_template('register.html')

# login page hosting----
@app.route('/login', methods=['GET','POST'])
def login():
    if request.method== 'POST':
        # handle request
        email=request.form['email']
        password=request.form['password']

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['name']= user.name
            session['email']= user.email
            session['password']= user.password
            return redirect('/dashboard')
        else:
            return render_template('login.html',error='invalid user')

    return render_template('login.html')

# Dashboard page hosting----
@app.route('/dashboard')
def dashboard():
    if 'email' in session:
        user = get_current_user()
        if not user:
            return redirect('/login')        
        # Get the user's personal details to access the profile photo
        personal = PersonalDetails.query.filter_by(user_id=user.id).first()
        
        return render_template('dashboard.html', name=(session['name']).title(), email=(session['email']), user_data=personal)
    else:
        return redirect('/login')

# Information Gathering page hosting----
@app.route('/info_gathering')
def info_gathering():
    if 'email' in session:
        return render_template('info_gathering.html')
    else:
        return redirect('/login')

# Save Personal Details
@app.route('/save_personal', methods=['POST'])
def save_personal():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    name = request.form.get('name')
    address = request.form.get('address')
    email = request.form.get('email')
    phone = request.form.get('phone')
    
    # Handle photo upload
    photo_path = None
    if 'photo' in request.files:
        photo = request.files['photo']
        if photo.filename != '' and allowed_file(photo.filename):
            filename = secure_filename(f"{user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}_{photo.filename}")
            photo_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            photo.save(photo_path)
            photo_path = photo_path.replace('static/', '')  # Store relative path
    
    # Check if personal details already exist
    personal = PersonalDetails.query.filter_by(user_id=user.id).first()
    
    if personal:
        # Update existing record
        personal.name = name
        personal.address = address
        personal.email = email
        personal.phone = phone
        if photo_path:
            personal.photo = photo_path
    else:
        # Create new record
        personal = PersonalDetails(
            name=name,
            address=address,
            email=email,
            phone=phone,
            photo=photo_path,
            user_id=user.id
        )
        db.session.add(personal)
    
    db.session.commit()
    flash('Personal details saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Education
@app.route('/save_education', methods=['POST'])
def save_education():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    course = request.form.get('course')
    school = request.form.get('school')
    grade = request.form.get('grade')
    year = request.form.get('year')
    
    education = Education(
        course=course,
        school=school,
        grade=grade,
        year=year,
        user_id=user.id
    )
    
    db.session.add(education)
    db.session.commit()
    flash('Education details saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Experience
@app.route('/save_experience', methods=['POST'])
def save_experience():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    company = request.form.get('company')
    job_title = request.form.get('job_title')
    start_date = request.form.get('start_date')
    end_date = request.form.get('end_date')
    details = request.form.get('details')
    
    experience = Experience(
        company=company,
        job_title=job_title,
        start_date=start_date,
        end_date=end_date,
        details=details,
        user_id=user.id
    )
    
    db.session.add(experience)
    db.session.commit()
    flash('Experience details saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Skill
@app.route('/save_skill', methods=['POST'])
def save_skill():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    skill_name = request.form.get('skill_name')
    skill_level = request.form.get('skill_level', 1)
    
    skill = Skill(
        skill_name=skill_name,
        skill_level=skill_level,
        user_id=user.id
    )
    
    db.session.add(skill)
    db.session.commit()
    flash('Skill saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Project
@app.route('/save_project', methods=['POST'])
def save_project():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    project_title = request.form.get('project_title')
    project_description = request.form.get('project_description')
    
    project = Project(
        project_title=project_title,
        project_description=project_description,
        user_id=user.id
    )
    
    db.session.add(project)
    db.session.commit()
    flash('Project saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Objective
@app.route('/save_objective', methods=['POST'])
def save_objective():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    objective_text = request.form.get('objective_text')
    
    # Check if objective already exists
    objective = Objective.query.filter_by(user_id=user.id).first()
    
    if objective:
        # Update existing record
        objective.objective_text = objective_text
    else:
        # Create new record
        objective = Objective(
            objective_text=objective_text,
            user_id=user.id
        )
        db.session.add(objective)
    
    db.session.commit()
    flash('Objective saved successfully!', 'success')
    return redirect('/info_gathering')

# Save Reference
@app.route('/save_reference', methods=['POST'])
def save_reference():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    referee_name = request.form.get('referee_name')
    referee_job = request.form.get('referee_job')
    referee_company = request.form.get('referee_company')
    referee_email = request.form.get('referee_email')
    referee_phone = request.form.get('referee_phone')
    
    reference = Reference(
        referee_name=referee_name,
        referee_job=referee_job,
        referee_company=referee_company,
        referee_email=referee_email,
        referee_phone=referee_phone,
        user_id=user.id
    )
    
    db.session.add(reference)
    db.session.commit()
    flash('Reference saved successfully!', 'success')
    return redirect('/info_gathering')


#Fetching user details to the my_profile.html page: 
@app.route('/my-profile')
def my_profile():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    user_details = {
        "user": user,
        "personal": PersonalDetails.query.filter_by(user_id=user.id).first(),
        "education": Education.query.filter_by(user_id=user.id).all(),
        "experience": Experience.query.filter_by(user_id=user.id).all(),
        "skills": Skill.query.filter_by(user_id=user.id).all(),
        "projects": Project.query.filter_by(user_id=user.id).all(),
        "objective": Objective.query.filter_by(user_id=user.id).first(),
        "references": Reference.query.filter_by(user_id=user.id).all(),
    }
    
    return render_template('my_profile.html', user_data=user_details)

# Add these routes to your existing app.py file

@app.route('/templates_pages')
def templates_page():
    if 'email' not in session:
        return redirect('/login')
    return render_template('templates_pages.html')

@app.route('/select_template/<template_id>')
def select_template(template_id):
    if 'email' not in session:
        return redirect('/login')
    
    # Store the selected template in session
    session['selected_template'] = template_id
    
    # Redirect to the profile page or info gathering page
    return redirect('/my-profile')

@app.route('/preview_template/<template_id>')
def preview_template(template_id):
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    user_details = {
        "user": user,
        "personal": PersonalDetails.query.filter_by(user_id=user.id).first(),
        "education": Education.query.filter_by(user_id=user.id).all(),
        "experience": Experience.query.filter_by(user_id=user.id).all(),
        "skills": Skill.query.filter_by(user_id=user.id).all(),
        "projects": Project.query.filter_by(user_id=user.id).all(),
        "objective": Objective.query.filter_by(user_id=user.id).first(),
        "references": Reference.query.filter_by(user_id=user.id).all(),
    }
    
    # Render the selected template with user data
    return render_template(f'{template_id}.html', user_data=user_details)

@app.route('/resume')
def resume():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    # Get the selected template from session, default to template_01
    template_id = session.get('selected_template', 'template_01')
    
    user_details = {
        "user": user,
        "personal": PersonalDetails.query.filter_by(user_id=user.id).first(),
        "education": Education.query.filter_by(user_id=user.id).all(),
        "experience": Experience.query.filter_by(user_id=user.id).all(),
        "skills": Skill.query.filter_by(user_id=user.id).all(),
        "projects": Project.query.filter_by(user_id=user.id).all(),
        "objective": Objective.query.filter_by(user_id=user.id).first(),
        "references": Reference.query.filter_by(user_id=user.id).all(),
    }
    
    # Render the selected template with user data
    return render_template(f'{template_id}.html', user_data=user_details)


# Add this route to get user data for the dashboard status
@app.route('/get_user_data')
def get_user_data():
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Get user data
    user_data = {
        "personal": PersonalDetails.query.filter_by(user_id=user.id).first() is not None,
        "education": [{"id": edu.id} for edu in Education.query.filter_by(user_id=user.id).all()],
        "skills": [{"id": skill.id} for skill in Skill.query.filter_by(user_id=user.id).all()],
        "projects": [{"id": project.id} for project in Project.query.filter_by(user_id=user.id).all()],
        "selected_template": session.get('selected_template', None)
    }
    
    return jsonify(user_data)

# route to save a template
@app.route('/save_template/<template_id>', methods=['POST'])
def save_template(template_id):
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if template is already saved
    existing = SavedTemplate.query.filter_by(user_id=user.id, template_id=template_id).first()
    
    if existing:
        # Template already saved, return success
        return jsonify({'status': 'success', 'message': 'Template already saved'})
    
    # Save the template
    saved_template = SavedTemplate(
        template_id=template_id,
        user_id=user.id
    )
    
    try:
        db.session.add(saved_template)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Template saved successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

# route to remove a saved template
@app.route('/remove_template/<template_id>', methods=['POST'])
def remove_template(template_id):
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Find the saved template
    saved_template = SavedTemplate.query.filter_by(user_id=user.id, template_id=template_id).first()
    
    if not saved_template:
        return jsonify({'status': 'error', 'message': 'Template not found'}), 404
    
    try:
        db.session.delete(saved_template)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Template removed successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

# Get all saved templates for a user
@app.route('/get_saved_templates')
def get_saved_templates():
    if 'email' not in session:
        return jsonify({'error': 'Not logged in'}), 401
    
    user = get_current_user()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    saved_templates = SavedTemplate.query.filter_by(user_id=user.id).all()
    template_ids = [template.template_id for template in saved_templates]
    
    return jsonify({'saved_templates': template_ids})

# saved_templates page routing
@app.route('/saved_templates')
def saved_templates():
    if 'email' not in session:
        return redirect('/login')
    
    user = get_current_user()
    if not user:
        return redirect('/login')
    
    # Get the user's saved templates from the database
    saved_templates = SavedTemplate.query.filter_by(user_id=user.id).all()
    template_ids = [template.template_id for template in saved_templates]
    
    # Pass the template IDs to the template
    return render_template('saved_templates.html', saved_template_ids=template_ids)

# privacy policy page routing :
@app.route('/privacy-policy')
def privacy_policy():
    return render_template("privacy-policy.html")


# terms-of-use page routing :
@app.route('/terms-of-use')
def terms_of_use():
    return render_template("terms-of-use.html")




################################################################################################################################################                                                                     ADMIN PANEL
################################################################################################################################################


# Add these routes to your existing app.py file

@app.route('/admin')
def admin_dashboard():
    # Add authentication check for admin users
    # You might want to add an is_admin field to your User model
    if 'email' not in session:
        return redirect('/login')
    
    # For now, you can check if the user is a specific admin email
    admin_emails = ['agnivaraha@gmail.com', 'instacvwebmail@gmail.com']  # Add your admin emails
    if session['email'] not in admin_emails:
        flash('Access denied. Admin privileges required.', 'error')
        return redirect('/dashboard')
    
    return render_template('admin.html')

@app.route('/admin/users')
def admin_get_users():
    # Check admin authentication
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    admin_emails = ['agnivaraha@gmail.com', 'instacvwebmail@gmail.com']
    if session['email'] not in admin_emails:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        # Get all users with their related data
        users = User.query.all()
        users_data = []
        
        for user in users:
            user_data = {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'personal': {
                    'phone': user.personal_details.phone if user.personal_details else None,
                    'address': user.personal_details.address if user.personal_details else None,
                    'photo': user.personal_details.photo if user.personal_details else None
                } if user.personal_details else None,
                'education': [{
                    'course': edu.course,
                    'school': edu.school,
                    'grade': edu.grade,
                    'year': edu.year
                } for edu in user.educations],
                'experience': [{
                    'company': exp.company,
                    'job_title': exp.job_title,
                    'start_date': exp.start_date,
                    'end_date': exp.end_date,
                    'details': exp.details
                } for exp in user.experiences],
                'skills': [{
                    'skill_name': skill.skill_name,
                    'skill_level': skill.skill_level
                } for skill in user.skills],
                'projects': [{
                    'project_title': project.project_title,
                    'project_description': project.project_description
                } for project in user.projects],
                'objective': {
                    'objective_text': user.objective.objective_text
                } if user.objective else None,
                'references': [{
                    'referee_name': ref.referee_name,
                    'referee_job': ref.referee_job,
                    'referee_company': ref.referee_company,
                    'referee_email': ref.referee_email,
                    'referee_phone': ref.referee_phone
                } for ref in user.references]
            }
            users_data.append(user_data)
        
        # Calculate statistics
        total_users = len(users)
        active_users = len([u for u in users if u.personal_details])  # Users with personal details
        total_resumes = sum(1 for u in users if u.personal_details and (u.educations or u.experiences))
        total_templates = SavedTemplate.query.count()
        
        stats = {
            'total_users': total_users,
            'active_users': active_users,
            'total_resumes': total_resumes,
            'total_templates': total_templates
        }
        
        return jsonify({
            'success': True,
            'users': users_data,
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/user/<int:user_id>')
def admin_get_user_details(user_id):
    # Check admin authentication
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    admin_emails = ['admin@instacv.com', 'instacvwebmail@gmail.com']
    if session['email'] not in admin_emails:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        
        user_data = {
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'personal': {
                'phone': user.personal_details.phone if user.personal_details else None,
                'address': user.personal_details.address if user.personal_details else None,
                'photo': user.personal_details.photo if user.personal_details else None
            } if user.personal_details else None,
            'education': [{
                'course': edu.course,
                'school': edu.school,
                'grade': edu.grade,
                'year': edu.year
            } for edu in user.educations],
            'experience': [{
                'company': exp.company,
                'job_title': exp.job_title,
                'start_date': exp.start_date,
                'end_date': exp.end_date,
                'details': exp.details
            } for exp in user.experiences],
            'skills': [{
                'skill_name': skill.skill_name,
                'skill_level': skill.skill_level
            } for skill in user.skills],
            'projects': [{
                'project_title': project.project_title,
                'project_description': project.project_description
            } for project in user.projects],
            'objective': {
                'objective_text': user.objective.objective_text
            } if user.objective else None,
            'references': [{
                'referee_name': ref.referee_name,
                'referee_job': ref.referee_job,
                'referee_company': ref.referee_company,
                'referee_email': ref.referee_email,
                'referee_phone': ref.referee_phone
            } for ref in user.references]
        }
        
        return jsonify({'success': True, 'user': user_data})
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/export/<int:user_id>')
def admin_export_user(user_id):
    # Check admin authentication
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    admin_emails = ['admin@instacv.com', 'instacvwebmail@gmail.com']
    if session['email'] not in admin_emails:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        
        # Create comprehensive user data export
        export_data = {
            'user_info': {
                'id': user.id,
                'name': user.name,
                'email': user.email
            },
            'personal_details': {
                'phone': user.personal_details.phone if user.personal_details else None,
                'address': user.personal_details.address if user.personal_details else None,
                'photo': user.personal_details.photo if user.personal_details else None
            } if user.personal_details else None,
            'education': [{
                'course': edu.course,
                'school': edu.school,
                'grade': edu.grade,
                'year': edu.year
            } for edu in user.educations],
            'experience': [{
                'company': exp.company,
                'job_title': exp.job_title,
                'start_date': exp.start_date,
                'end_date': exp.end_date,
                'details': exp.details
            } for exp in user.experiences],
            'skills': [{
                'skill_name': skill.skill_name,
                'skill_level': skill.skill_level
            } for skill in user.skills],
            'projects': [{
                'project_title': project.project_title,
                'project_description': project.project_description
            } for project in user.projects],
            'objective': {
                'objective_text': user.objective.objective_text
            } if user.objective else None,
            'references': [{
                'referee_name': ref.referee_name,
                'referee_job': ref.referee_job,
                'referee_company': ref.referee_company,
                'referee_email': ref.referee_email,
                'referee_phone': ref.referee_phone
            } for ref in user.references],
            'saved_templates': [template.template_id for template in user.saved_templates],
            'export_date': datetime.now().isoformat()
        }
        
        import json
        from flask import Response
        
        json_data = json.dumps(export_data, indent=2)
        
        return Response(
            json_data,
            mimetype='application/json',
            headers={'Content-Disposition': f'attachment; filename=user_{user_id}_data.json'}
        )
        
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/admin/delete/<int:user_id>', methods=['DELETE'])
def admin_delete_user(user_id):
    # Check admin authentication
    if 'email' not in session:
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    admin_emails = ['admin@instacv.com', 'instacvwebmail@gmail.com']
    if session['email'] not in admin_emails:
        return jsonify({'success': False, 'message': 'Access denied'}), 403
    
    try:
        user = User.query.get_or_404(user_id)
        
        # Delete all related records first (due to foreign key constraints)
        PersonalDetails.query.filter_by(user_id=user_id).delete()
        Education.query.filter_by(user_id=user_id).delete()
        Experience.query.filter_by(user_id=user_id).delete()
        Skill.query.filter_by(user_id=user_id).delete()
        Project.query.filter_by(user_id=user_id).delete()
        Objective.query.filter_by(user_id=user_id).delete()
        Reference.query.filter_by(user_id=user_id).delete()
        SavedTemplate.query.filter_by(user_id=user_id).delete()
        
        # Delete the user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'User deleted successfully'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


#                                                   -----------APP RUNNING-----------

if __name__=="__main__":
    app.run(debug=True)